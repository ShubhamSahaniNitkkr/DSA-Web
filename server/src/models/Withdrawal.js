import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['withdraw', 'donate'], required: true },
    amount: { type: Number, required: true },
    upiId: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model('Withdrawal', withdrawalSchema);
