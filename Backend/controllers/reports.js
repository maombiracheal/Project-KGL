const Sale = require('../models/Sale');
const CreditSale = require('../models/CreditSale');
const Produce = require('../models/Produce');

exports.getDirectorReport = async (req, res) => {
    try {
        // 1. Aggregate Total Cash Sales by Branch
        const salesReport = await Sale.aggregate([
            {
                $group: {
                    _id: "$branch",
                    totalRevenue: { $sum: "$amountPaidUGX" },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        // 2. Aggregate Total Credit Debt by Branch
        const creditReport = await CreditSale.aggregate([
            {
                $group: {
                    _id: "$branch",
                    totalAmountDue: { $sum: "$amountDueUGX" },
                    activeCreditCustomers: { $sum: 1 }
                }
            }
        ]);

        // 3. Aggregate stock totals by branch
        const stockReport = await Produce.aggregate([
            {
                $group: {
                    _id: "$branch",
                    totalStockKg: {
                        $sum: {
                            $cond: [
                                { $gt: ["$quantityKg", 0] },
                                "$quantityKg",
                                "$quantity"
                            ]
                        }
                    },
                    stockItems: { $sum: 1 }
                }
            }
        ]);

        const totals = {
            totalRevenueUGX: salesReport.reduce((sum, row) => sum + (row.totalRevenue || 0), 0),
            totalSalesTransactions: salesReport.reduce((sum, row) => sum + (row.totalTransactions || 0), 0),
            totalCreditOutstandingUGX: creditReport.reduce((sum, row) => sum + (row.totalAmountDue || 0), 0),
            totalCreditCustomers: creditReport.reduce((sum, row) => sum + (row.activeCreditCustomers || 0), 0),
            totalStockKg: stockReport.reduce((sum, row) => sum + (row.totalStockKg || 0), 0),
        };

        res.status(200).json({
            businessName: "Karibu Groceries LTD",
            generatedAt: new Date(),
            director: req.user.fullName || "Mr. Orban",
            totals,
            salesSummary: salesReport,
            creditSummary: creditReport,
            inventorySummary: stockReport
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Error generating director reports", 
            error: error.message 
        });
    }
};
