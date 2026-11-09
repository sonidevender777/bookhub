const TIME_MACHINE_LEGACY_URL = 'https://www.gutenberg.org/files/35/35-pdf.pdf';
const TIME_MACHINE_PDF_URL = 'https://www.fourmilab.ch/etexts/www/wells/timemach/timemach.pdf';

// Older seed records use Gutenberg's legacy PDF-shaped URL. Those paths now
// resolve more reliably to Gutenberg's browser reader, which is an online
// digital edition rather than a downloadable PDF.
const resolveDigitalFileUrl = (assetKey) => {
  if (assetKey === TIME_MACHINE_LEGACY_URL) return TIME_MACHINE_PDF_URL;
  const match = assetKey?.match(/^https:\/\/www\.gutenberg\.org\/files\/(\d+)\/\1-pdf\.pdf$/i);
  if (match) return `https://www.gutenberg.org/cache/epub/${match[1]}/pg${match[1]}-images.html`;
  return assetKey;
};

const isPdfUrl = (url) => /\.pdf(?:$|[?#])/i.test(url || '');

const getDigitalKind = (assetKey) => (isPdfUrl(resolveDigitalFileUrl(assetKey)) ? 'pdf' : 'web');

module.exports = { resolveDigitalFileUrl, getDigitalKind, isPdfUrl };
