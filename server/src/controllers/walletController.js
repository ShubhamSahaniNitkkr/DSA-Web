import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import { RUPEE_PER_COIN, PAISE_PER_COIN } from '../constants.js';

export const getWallet = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({
      success: true,
      coins: req.user.coins,
      rupees: req.user.coins * RUPEE_PER_COIN,
      paise: req.user.coins * PAISE_PER_COIN,
      paisePerCoin: PAISE_PER_COIN,
      upiId: req.user.upiId,
      withdrawals,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const { type, amount, upiId } = req.body;
    if (!['withdraw', 'donate'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    if (type === 'withdraw' && !upiId) {
      return res.status(400).json({ success: false, message: 'UPI ID required for withdrawal' });
    }
    if (amount > req.user.coins) {
      return res.status(400).json({ success: false, message: 'Insufficient coins' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { coins: -amount },
      ...(upiId ? { upiId } : {}),
    });

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      type,
      amount,
      upiId: upiId || req.user.upiId,
      status: type === 'donate' ? 'completed' : 'pending',
    });

    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      withdrawal,
      coins: user.coins,
      message: type === 'donate' ? 'Thank you for your donation!' : 'Withdrawal request submitted',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
