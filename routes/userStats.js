import express from 'express';
import { ObjectId } from 'mongodb';
import connectDB from '../mongodbConnection.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get user stats
router.get('/all-stats', authenticateUser, async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const collection = database.collection('UserStats');

        let stats = await collection.findOne({ userId: req.user.id });

        if (!stats) {
            stats = {
                userId: req.user.id,
                paperSaved: 0,
                paperSavedTarget: 10,
                ecoPurchases: 0,
                purchaseTarget: 50,
                ecoPoints: 0,
                nextRewardThreshold: 100,
                processedOrders: [],
                rewards: [
                    {
                        name: "Green Shopper",
                        description: "Complete 5 eco-friendly purchases",
                        pointsRequired: 50,
                        unlocked: false,
                        icon: "fas fa-seedling"
                    },
                    {
                        name: "Paper Saver",
                        description: "Complete 5 eco-friendly purchases",
                        pointsRequired: 100,
                        unlocked: false,
                        icon: "fas fa-file-alt"
                    },
                    {
                        name: "Eco Warrior",
                        description: "Save 5kg of paper",
                        pointsRequired: 200,
                        unlocked: false,
                        icon: "fas fa-award"
                    },
                    {
                        name: "Planet Protector",
                        description: "Complete 40 eco-friendly purchases",
                        pointsRequired: 300,
                        unlocked: false,
                        icon: "fas fa-globe-americas"
                    },
                    {
                        name: "Forest Guardian",
                        description: "Save your first tree (17kg of paper)",
                        pointsRequired: 400,
                        unlocked: false,
                        icon: "fas fa-tree"
                    }
                ]
            };

            await collection.insertOne(stats);
        }

        res.json(stats);
        await client.close();

    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

// Update user stats after purchase
router.post('/update', authenticateUser,  async (req, res) => {
    try {
        const { paperSaved, ecoPurchases, orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        const { client, database } = await connectDB();
        const statsCollection = database.collection('UserStats');
        const ordersCollection = database.collection('Orders');

        const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let stats = await statsCollection.findOne({ userId: req.user.id });

        if (!stats) {
            stats = {
                userId: req.user.id,
                paperSaved: 0,
                paperSavedTarget: 10,
                ecoPurchases: 0,
                purchaseTarget: 50,
                ecoPoints: 0,
                nextRewardThreshold: 100,
                processedOrders: [],
                rewards: [
                    {
                        name: "Green Shopper",
                        description: "Complete 5 eco-friendly purchases",
                        pointsRequired: 50,
                        unlocked: false,
                        icon: "fas fa-seedling"
                    },
                    {
                        name: "Paper Saver",
                        description: "Save 5kg of paper",
                        pointsRequired: 100,
                        unlocked: false,
                        icon: "fas fa-file-alt"
                    },
                    {
                        name: "Eco Warrior",
                        description: "Save 10kg of paper",
                        pointsRequired: 200,
                        unlocked: false,
                        icon: "fas fa-award"
                    },
                    {
                        name: "Planet Protector",
                        description: "Complete 25 eco-friendly purchases",
                        pointsRequired: 300,
                        unlocked: false,
                        icon: "fas fa-globe-americas"
                    },
                    {
                        name: "Forest Guardian",
                        description: "Save your first tree (17kg of paper)",
                        pointsRequired: 400,
                        unlocked: false,
                        icon: "fas fa-tree"
                    }
                ]
            };
        }

        if (stats.processedOrders && stats.processedOrders.includes(orderId)) {
            return res.status(400).json({ message: 'Order already processed for rewards' });
        }

        const updatedPaperSaved = stats.paperSaved + paperSaved;
        const updatedEcoPurchases = stats.ecoPurchases + ecoPurchases;
        const pointsEarned = Math.round(paperSaved * 10) + (ecoPurchases * 5);
        const updatedPoints = stats.ecoPoints + pointsEarned;

        const updatedRewards = stats.rewards.map(reward => {
            if (!reward.unlocked && updatedPoints >= reward.pointsRequired) {
                return { ...reward, unlocked: true };
            }
            return reward;
        });

        let nextThreshold = stats.nextRewardThreshold;
        for (const reward of updatedRewards) {
            if (!reward.unlocked && reward.pointsRequired > updatedPoints && reward.pointsRequired < nextThreshold) {
                nextThreshold = reward.pointsRequired;
            }
        }

        let newPaperTarget = stats.paperSavedTarget;
        let newPurchaseTarget = stats.purchaseTarget;

        if (updatedPaperSaved >= stats.paperSavedTarget) {
            newPaperTarget = stats.paperSavedTarget * 2;
        }

        if (updatedEcoPurchases >= stats.purchaseTarget) {
            newPurchaseTarget = stats.purchaseTarget * 2;
        }

        const processedOrders = stats.processedOrders || [];
        processedOrders.push(orderId);

        await statsCollection.updateOne(
            { userId: req.user.id },
            {
                $set: {
                    paperSaved: updatedPaperSaved,
                    paperSavedTarget: newPaperTarget,
                    ecoPurchases: updatedEcoPurchases,
                    purchaseTarget: newPurchaseTarget,
                    ecoPoints: updatedPoints,
                    nextRewardThreshold: nextThreshold,
                    rewards: updatedRewards,
                    processedOrders
                }
            },
            { upsert: true }
        );

        const updatedStats = await statsCollection.findOne({ userId: req.user.id });
        res.json(updatedStats);
        await client.close();

    } catch (error) {
        console.error('Error updating user stats:', error);
        res.status(500).json({ message: 'Error updating stats', error: error.message });
    }
});

// Get overall community impact
router.get('/community-impact', async (req, res) => {
    try {
        const { client, database } = await connectDB();
        const collection = database.collection('UserStats');

        const result = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalPaperSaved: { $sum: "$paperSaved" },
                    totalEcoPurchases: { $sum: "$ecoPurchases" },
                    userCount: { $sum: 1 }
                }
            }
        ]).toArray();

        if (result.length === 0) {
            return res.json({
                totalPaperSaved: 0,
                totalEcoPurchases: 0,
                userCount: 0,
                treesSaved: 0
            });
        }

        const impact = result[0];
        impact.treesSaved = impact.totalPaperSaved / 17;
        delete impact._id;

        res.json(impact);
        await client.close();

    } catch (error) {
        console.error('Error fetching community impact:', error);
        res.status(500).json({ message: 'Error fetching community impact', error: error.message });
    }
});

export default router;