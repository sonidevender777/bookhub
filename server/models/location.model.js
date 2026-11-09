const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    floor: { type: String, required: true, trim: true, maxlength: 80 },
    section: { type: String, required: true, trim: true, maxlength: 80 },
    rack: { type: String, required: true, trim: true, maxlength: 40 },
    shelf: { type: String, required: true, trim: true, maxlength: 40 },
    label: { type: String, required: true, trim: true, maxlength: 260 },
    notes: { type: String, trim: true, maxlength: 500 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

locationSchema.index({ branch: 1, floor: 1, section: 1, rack: 1, shelf: 1 }, { unique: true });
locationSchema.index({ label: 'text', floor: 'text', section: 'text', rack: 'text', shelf: 'text' });

locationSchema.pre('validate', function setLabel() {
  this.label = [this.floor, this.section, this.rack, this.shelf].filter(Boolean).join(' > ');
});

module.exports = mongoose.model('Location', locationSchema);
