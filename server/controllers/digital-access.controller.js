const DigitalAccess = require('../models/digital-access.model');
const ApiError = require('../utils/api-error');
const { digitalAccessPopulate, expireOldDigitalAccess } = require('../services/digital-access.service');
const { resolveDigitalFileUrl, getDigitalKind } = require('../utils/digital-file');

const listMyDigitalAccess = async (req, res, next) => {
  try {
    await expireOldDigitalAccess();
    const records = await digitalAccessPopulate(DigitalAccess.find({ user: req.user._id }).sort({ expirationTime: -1 }).lean());
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const openDigitalAccess = async (req, res, next) => {
  try {
    await expireOldDigitalAccess();
    const access = await digitalAccessPopulate(
      DigitalAccess.findOne({ _id: req.params.accessId, user: req.user._id }),
    );
    if (!access) throw new ApiError('Digital access not found.', 404);
    if (!access.isActiveNow()) throw new ApiError('This digital rental has expired or is no longer available.', 403);

    const fileUrl = resolveDigitalFileUrl(access.assetKey);
    if (fileUrl && fileUrl !== access.assetKey) access.assetKey = fileUrl;
    access.lastAccessedAt = new Date();
    await access.save();

    res.status(200).json({
      success: true,
      data: {
        access: {
          _id: access._id,
          accessNumber: access.accessNumber,
          book: access.book,
          expirationTime: access.expirationTime,
          format: access.format,
        },
        reader: {
          mode: fileUrl?.startsWith('http') ? 'external_reader' : 'not_attached',
          kind: getDigitalKind(fileUrl),
          fileUrl: fileUrl?.startsWith('http') ? fileUrl : undefined,
          message: fileUrl?.startsWith('http')
            ? (getDigitalKind(fileUrl) === 'pdf'
              ? 'Your secure BookHub reading access is active. Open the PDF using the button below.'
              : 'Your secure BookHub reading access is active. Open the digital edition using the button below.')
            : 'No digital file URL has been attached yet. Add one from the admin inventory form for this book.',
          title: `Reading access unlocked for ${access.book.title}.`,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const listDigitalAccess = async (req, res, next) => {
  try {
    await expireOldDigitalAccess();
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user) filter.user = req.query.user;
    const records = await digitalAccessPopulate(
      DigitalAccess.find(filter).populate('user', 'fullName email').sort({ expirationTime: -1 }).limit(150).lean(),
    );
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const clearDigitalHistory = async (req, res, next) => {
  try {
    const isAdmin = ['manager', 'owner'].includes(req.user.role);
    const filter = { status: { $in: ['expired', 'revoked'] } };
    if (!isAdmin) filter.user = req.user._id;
    const result = await DigitalAccess.deleteMany(filter);
    res.status(200).json({ success: true, message: `${result.deletedCount} digital access record${result.deletedCount === 1 ? '' : 's'} cleared.` });
  } catch (error) {
    next(error);
  }
};

module.exports = { listMyDigitalAccess, openDigitalAccess, listDigitalAccess, clearDigitalHistory };
