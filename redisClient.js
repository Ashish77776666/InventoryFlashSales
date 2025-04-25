const redis = require('ioredis');
// const client = redis.createClient(); // use {url: 'redis://localhost:6379'} if needed
const client = new redis({ db: 1 });
// Subscriber client for keyspace notifications
const subscriber = new redis({ db: 1 });
// client.config('SET', 'notify-keyspace-events', 'Ex')
//   .then(() => console.log('Keyspace notifications enabled (Ex)'))
//   .catch(console.error);
// Subscribe to expired events
let time = 60;
subscriber.subscribe('__keyevent@1__:expired', (err, count) => {
    console.log(`Subscribed to ${count} channels`);
});
// Handle expired keys
subscriber.on('message', async (channel, message) => {
    console.log(message)
    if (channel === '__keyevent@1__:expired' && message.startsWith('reservation:')) {
        const parts = message.split(':');
        if (parts.length === 3) {
            const userId = parts[1];
            const productName = parts[2];
            try {
                const reservedQty = await client.hget(`reservations:${productName}`, userId);
                if (reservedQty) {
                    await client.incrby(`inventory:${productName}`, parseInt(reservedQty));
                    await client.hdel(`reservations:${productName}`, userId);
                    console.log(`Released ${reservedQty} of ${productName} back to inventory`);
                }
            } catch (err) {
                console.error(`Error handling expired reservation: ${err}`);
            }
        }
    }
});

// Example: Setting a reservation in /api/cart/add
async function setReservation(userId, productName, qty) {
    try {
        await client.decrby(`inventory:${productName}`, qty);
        // await client.incrby(`reservation:${userId}:${productName}`, qty, 'EX', 600);
        await client.incrby(`reservation:${userId}:${productName}`, qty);
        await client.expire(`reservation:${userId}:${productName}`, time); // 600 seconds = 10 min

        await client.hincrby(`reservations:${productName}`, userId, qty);
    } catch (err) {
        console.error(`Error setting reservation: ${err}`);
        throw err;
    }
}

// Example: Releasing a reservation in /api/cart/sub or /api/cart/purchase
async function releaseReservation(userId, productName, qty) {
    try {
        const reservedQty = parseInt(await client.get(`reservation:${userId}:${productName}`));
        console.log(`reservedQty: ${reservedQty} qty: ${qty} reservation:${userId}:${productName}`)
        if (reservedQty) {
            const newReservedQty = reservedQty - qty;
            if (newReservedQty < 0) {
                console.log(typeof newReservedQty, " newReservedQty: ", newReservedQty, qty, "  Why not ")
                console.log("hii1")
                return res.status(400).json({ error: `please addToCart in ${productName} to proceed` });
            } else if (newReservedQty === 0) {
                await client.del(`reservation:${userId}:${productName}`);
                await client.hdel(`reservations:${productName}`, userId);
                console.log("hii2")
            }
            else {
                await client.decrby(`reservation:${userId}:${productName}`, qty);
                // await client.expire(`reservation:${userId}:${productName}`, 600); // 600 seconds = 10 min
                await client.hincrby(`reservations:${productName}`, userId, -1);
                console.log("hii3")

            }
            await client.incrby(`inventory:${productName}`, qty);
        }
    } catch (err) {
        console.error(`Error releasing reservation: ${err}`);
        throw err;
    }
}

async function purchase(userId) {
    const pattern = `reservation:${userId}:*`;
    // Object to store product names and quantities
    const purchasedItems = {};
  
    return new Promise((resolve, reject) => {
      // Create a readable stream of matching keys
      const stream = client.scanStream({
        match: pattern, // Only reservation keys for this user
        count: 100, // Scan in increments of 100 keys per batch
      });
  
      stream.on('data', async (keys) => {
        // Pause the stream while we process the batch
        stream.pause();
        try {
          for (const resKey of keys) {
            // resKey looks like "reservation:42:widget"
            const [, , productName] = resKey.split(':');
  
            // 1. Get reserved quantity (string) → int, default 0
            const reservedQty = parseInt(await client.get(resKey), 10) || 0;
            if (reservedQty <= 0) continue;
  
            // 2. Store product name and quantity in the object
            purchasedItems[productName] = reservedQty;
  
            // 3. Remove this user’s reservation field from the hash
            await client.hdel(
              `reservations:${productName}`,
              userId
            );
  
            // 4. Delete the reservation key itself
            await client.del(resKey);
          }
          // Resume scanning next batch
          stream.resume();
        } catch (err) {
          // Stop on error
          stream.destroy(err);
        }
      });
  
      stream.on('end', () => {
        // All keys processed, resolve with purchasedItems
        resolve(purchasedItems);
      });
  
      stream.on('error', (err) => {
        // Any stream error
        reject(err);
      });
    });
}

module.exports = { purchase, releaseReservation, setReservation, client };