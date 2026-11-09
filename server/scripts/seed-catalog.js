const mongoose = require('mongoose');
const config = require('../config/env');
const Author = require('../models/author.model');
const Category = require('../models/category.model');
const Publisher = require('../models/publisher.model');
const Book = require('../models/book.model');
const slugify = require('../utils/slug');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const upsertByName = async (Model, record) => {
  const existing = await Model.findOne({ name: record.name });
  if (existing) {
    Object.assign(existing, record);
    await existing.save();
    return existing;
  }
  return Model.create(record);
};

const seedCatalog = async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required before demo data can be seeded.');

  await mongoose.connect(config.mongoUri);

  const categories = {};
  for (const record of [
    { name: 'Fiction', description: 'Stories for thoughtful everyday reading.', imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 1 },
    { name: 'Science Fiction', description: 'Future worlds, bold ideas, and journeys beyond the familiar.', imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 2 },
    { name: 'Fantasy', description: 'Mythical worlds, magic, and unforgettable quests.', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 3 },
    { name: 'Mystery & Thriller', description: 'Clever clues, suspenseful plots, and page-turning mysteries.', imageUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 4 },
    { name: 'Romance', description: 'Stories of connection, courage, and the many forms of love.', imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 5 },
    { name: 'Historical Fiction', description: 'Compelling stories inspired by the people and places of the past.', imageUrl: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 6 },
    { name: 'Mythology & Folklore', description: 'Ancient legends, cultural stories, and timeless heroes.', imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 7 },
    { name: 'Biography & Memoir', description: 'Real lives, personal journeys, and lessons from remarkable people.', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 8 },
    { name: 'Personal Growth', description: 'Practical ideas for building calmer, stronger everyday habits.', imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 9 },
    { name: 'Business & Finance', description: 'Useful thinking for work, leadership, money, and entrepreneurship.', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 10 },
    { name: 'Academic & Study', description: 'Study guides and reference material for focused learners.', imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 11 },
    { name: 'Technology & Computing', description: 'Programming, digital systems, and the tools shaping tomorrow.', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 12 },
    { name: 'History', description: 'Ideas, events, and people that shaped our shared world.', imageUrl: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 13 },
    { name: 'Philosophy', description: 'Questions and perspectives for thinking more deeply about life.', imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 14 },
    { name: 'Poetry', description: 'Expressive words, rhythm, imagery, and feeling.', imageUrl: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 15 },
    { name: 'Children\'s Books', description: 'Curious, imaginative, and memorable reads for young minds.', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 16 },
    { name: 'Young Readers', description: 'Adventures and ideas for growing readers.', imageUrl: 'https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 17 },
    { name: 'Health & Wellness', description: 'Evidence-informed reading for a healthier, steadier life.', imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 18 },
    { name: 'Travel', description: 'Guides and stories that make the world feel closer.', imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 19 },
    { name: 'Exam Preparation', description: 'Focused practice and revision support for important exams.', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&fm=webp&w=640&q=60', sortOrder: 20 },
  ]) {
    categories[record.name] = await upsertByName(Category, record);
  }

  // Older local databases used these labels. Move their books to the new
  // canonical sections and hide the legacy cards so empty duplicate sections
  // do not remain on the home page.
  for (const [legacyName, canonicalName] of Object.entries({
    Academic: 'Academic & Study',
    'Classic Fiction': 'Fiction',
    Fictional: 'Fiction',
    motivation: 'Personal Growth',
  })) {
    const legacy = await Category.findOne({ name: new RegExp(`^${legacyName}$`, 'i') });
    const canonical = categories[canonicalName];
    if (!legacy || !canonical || String(legacy._id) === String(canonical._id)) continue;
    await Book.updateMany({ categories: legacy._id }, { $addToSet: { categories: canonical._id } });
    await Book.updateMany({ categories: legacy._id }, { $pull: { categories: legacy._id } });
    await Category.updateOne({ _id: legacy._id }, { $set: { isActive: false } });
  }

  const authors = {};
  for (const record of [
    { name: 'Anaya Mehra', biography: 'A Rewari-based writer of contemporary fiction.' },
    { name: 'Rohan Kapoor', biography: 'An educator who writes accessible study guides.' },
    { name: 'Mira Sen', biography: 'A writer focused on mindful habits and everyday growth.' },
    { name: 'Kabir Nanda', biography: 'A storyteller creating adventurous books for young readers.' },
    { name: 'Jane Austen', biography: 'English novelist known for social observation and classic fiction.' },
    { name: 'Mary Shelley', biography: 'English novelist whose work helped shape modern science fiction.' },
    { name: 'Lewis Carroll', biography: 'English writer remembered for imaginative children\'s literature.' },
    { name: 'Arthur Conan Doyle', biography: 'Scottish writer and creator of the Sherlock Holmes stories.' },
    { name: 'Herman Melville', biography: 'American novelist and short story writer.' },
    { name: 'Charles Dickens', biography: 'English novelist known for memorable characters and social commentary.' },
    { name: 'Bram Stoker', biography: 'Irish author best known for the gothic novel Dracula.' },
    { name: 'Charlotte Bronte', biography: 'English novelist and poet.' },
    { name: 'Mark Twain', biography: 'American author and humorist.' },
    { name: 'Leo Tolstoy', biography: 'Russian novelist known for large-scale historical fiction.' },
    { name: 'Franz Kafka', biography: 'German-speaking writer known for distinctive modernist fiction.' },
    { name: 'Frances Hodgson Burnett', biography: 'British-American novelist known for children\'s literature.' },
    { name: 'H. G. Wells', biography: 'English writer known for influential science fiction novels.' },
    { name: 'Chetan Bhagat', biography: 'Indian author known for accessible contemporary fiction about relationships, ambition, and young adulthood.' },
    { name: 'Fyodor Dostoevsky', biography: 'Russian novelist whose psychologically rich works explore morality, faith, and human nature.' },
    { name: 'Arundhati Roy', biography: 'Indian author and essayist known for richly observed fiction and public writing.' },
    { name: 'William Shakespeare', biography: 'English playwright and poet whose works remain central to world literature.' },
    { name: 'Héctor García', biography: 'Author and technologist who writes about Japanese culture, longevity, and purposeful living.' },
    { name: 'Francesc Miralles', biography: 'Spanish writer and lecturer focused on wellbeing, creativity, and purposeful living.' },
    { name: 'James Clear', biography: 'Writer and speaker focused on habits, decision-making, and continuous improvement.' },
    { name: 'Simon Singh', biography: 'Science writer who explains mathematics and cosmology for general readers.' },
    { name: 'Paulo Coelho', biography: 'Brazilian novelist known for philosophical stories about purpose, courage, and self-discovery.' },
    { name: 'Rudyard Kipling', biography: 'English author and poet remembered for imaginative stories and poems.' },
    { name: 'Neil Gaiman', biography: 'English author of fantasy, mythology, and speculative fiction.' },
    { name: 'Stephen Fry', biography: 'English actor, writer, and presenter known for accessible retellings of classical mythology.' },
    { name: 'Rick Riordan', biography: 'American author known for bringing mythology to young readers.' },
    { name: 'Walter Isaacson', biography: 'American writer and biographer of influential innovators and leaders.' },
    { name: 'A. P. J. Abdul Kalam', biography: 'Indian aerospace scientist and former President whose autobiography inspires learners.' },
    { name: 'Michelle Obama', biography: 'Author and former First Lady whose memoir reflects on identity, work, and public life.' },
    { name: 'Robert Kiyosaki', biography: 'Author and entrepreneur known for accessible personal-finance writing.' },
    { name: 'Napoleon Hill', biography: 'American self-help author known for writing about goals, persistence, and achievement.' },
    { name: 'Benjamin Graham', biography: 'Economist and investor widely regarded as a founder of value investing.' },
    { name: 'Robert C. Martin', biography: 'Software engineer and author known for practical guidance on maintainable code.' },
    { name: 'Andrew Hunt', biography: 'Software author and consultant focused on pragmatic development practices.' },
    { name: 'David Thomas', biography: 'Software author and consultant focused on practical programming principles.' },
    { name: 'Steve McConnell', biography: 'Software engineer and author known for evidence-based development practices.' },
    { name: 'Rupi Kaur', biography: 'Poet known for concise, illustrated writing about love, loss, healing, and growth.' },
    { name: 'Rabindranath Tagore', biography: 'Bengali poet, writer, composer, and Nobel laureate.' },
    { name: 'Walt Whitman', biography: 'American poet whose work expanded the possibilities of free verse.' },
    { name: 'Matthew Walker', biography: 'Neuroscientist and author who writes about sleep and health.' },
    { name: 'Bessel van der Kolk', biography: 'Psychiatrist and researcher known for work on trauma and recovery.' },
    { name: 'Michael Greger', biography: 'Physician and author focused on nutrition and disease prevention.' },
    { name: 'Jules Verne', biography: 'French novelist known for pioneering adventure and science-fiction stories.' },
    { name: 'Jon Krakauer', biography: 'American writer known for narrative nonfiction about adventure and difficult choices.' },
    { name: 'Elizabeth Gilbert', biography: 'American author known for memoir and fiction about travel, creativity, and self-discovery.' },
    { name: 'Norman Lewis', biography: 'Author and educator known for practical vocabulary and language-learning books.' },
    { name: 'R. S. Aggarwal', biography: 'Indian author of widely used quantitative aptitude preparation books.' },
    { name: 'S. P. Bakshi', biography: 'Indian author of competitive-exam English preparation books.' },
    { name: 'J. R. R. Tolkien', biography: 'English writer and philologist best known for shaping modern fantasy literature.' },
    { name: 'C. S. Lewis', biography: 'British writer and scholar known for imaginative fantasy and literary criticism.' },
    { name: 'J. K. Rowling', biography: 'British author known for the Harry Potter fantasy series.' },
    { name: 'Oscar Wilde', biography: 'Irish writer and poet known for wit, aestheticism, and classic fiction.' },
    { name: 'F. Scott Fitzgerald', biography: 'American novelist known for capturing the Jazz Age and its ambitions.' },
    { name: 'Daniel Defoe', biography: 'English writer and journalist known for early English novels and social observation.' },
    { name: 'Jack London', biography: 'American novelist and journalist known for adventure stories and vivid natural settings.' },
    { name: 'Robert Louis Stevenson', biography: 'Scottish novelist and poet known for gothic adventure and suspense.' },
    { name: 'Homer', biography: 'Ancient Greek poet traditionally credited with the epic poem The Odyssey.' },
  ]) {
    authors[record.name] = await upsertByName(Author, record);
  }

  const publisher = await upsertByName(Publisher, {
    name: 'BookHub Press',
    description: 'Demo publishing imprint for the BookHub catalog.',
  });

  const books = [
    {
      title: 'The Quiet Between Pages',
      isbn13: '9780000000001',
      authors: [authors['Anaya Mehra']._id],
      publisher: publisher._id,
      categories: [categories.Fiction._id],
      genres: ['Contemporary Fiction', 'Literary Fiction'],
      publicationDate: new Date('2024-08-01'),
      pageCount: 304,
      description: 'A warm, reflective story about a student who finds unexpected direction while restoring a forgotten neighborhood bookshop.',
      cover: {
        url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&fm=webp&w=640&q=60',
        altText: 'Warm book cover on a reading desk',
      },
      purchasePrice: 399,
      physicalRental: { enabled: true, price: 40, durationDays: 14 },
      digitalRental: { enabled: false, price: 0, durationDays: 14 },
      digitalEnabled: false,
      featured: true,
      tags: ['bookshop', 'student life', 'hope'],
      popularityScore: 82,
    },
    {
      title: 'Study Smarter, Not Longer',
      isbn13: '9780000000002',
      authors: [authors['Rohan Kapoor']._id],
      publisher: publisher._id,
      categories: [categories['Academic & Study']._id],
      genres: ['Education', 'Study Skills'],
      publicationDate: new Date('2025-01-10'),
      pageCount: 216,
      description: 'A practical guide for learners who want clearer revision routines, stronger recall, and calmer exam preparation.',
      cover: {
        url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&fm=webp&w=640&q=60',
        altText: 'Study books and notes on a desk',
      },
      purchasePrice: 349,
      physicalRental: { enabled: true, price: 35, durationDays: 14 },
      digitalRental: { enabled: false, price: 0, durationDays: 14 },
      digitalEnabled: false,
      featured: true,
      tags: ['students', 'exams', 'learning'],
      popularityScore: 96,
    },
    {
      title: 'Small Rituals, Brighter Days',
      isbn13: '9780000000003',
      authors: [authors['Mira Sen']._id],
      publisher: publisher._id,
      categories: [categories['Personal Growth']._id],
      genres: ['Self Help', 'Wellbeing'],
      publicationDate: new Date('2024-11-18'),
      pageCount: 240,
      description: 'Gentle and useful daily practices for readers who want to create steadier routines without chasing perfection.',
      cover: {
        url: 'https://images.unsplash.com/photo-1490633874781-1c63cc424610?auto=format&fit=crop&fm=webp&w=640&q=60',
        altText: 'Calm reading setup with flowers',
      },
      purchasePrice: 379,
      physicalRental: { enabled: true, price: 38, durationDays: 14 },
      digitalRental: { enabled: false, price: 0, durationDays: 14 },
      digitalEnabled: false,
      tags: ['habits', 'wellbeing', 'mindfulness'],
      popularityScore: 74,
    },
    {
      title: 'The Lantern Map',
      isbn13: '9780000000004',
      authors: [authors['Kabir Nanda']._id],
      publisher: publisher._id,
      categories: [categories['Young Readers']._id],
      genres: ['Adventure', 'Fantasy'],
      publicationDate: new Date('2023-06-20'),
      pageCount: 192,
      description: 'Two friends follow a glowing map through their town and discover that bravery can begin with a single question.',
      cover: {
        url: 'https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&fm=webp&w=640&q=60',
        altText: 'Adventure book with warm light',
      },
      purchasePrice: 299,
      physicalRental: { enabled: true, price: 30, durationDays: 14 },
      digitalRental: { enabled: false, price: 0, durationDays: 14 },
      digitalEnabled: false,
      featured: true,
      tags: ['adventure', 'friendship', 'family'],
      popularityScore: 88,
    },
  ];

  const classicBooks = [
    ['Pride and Prejudice', 'Jane Austen', '9780141439518', 299, 496, 'A witty and enduring story about first impressions, family expectations and finding a meaningful relationship.', 'https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg', 'https://www.gutenberg.org/files/1342/1342-pdf.pdf', 1342, 'Romance'],
    ['Frankenstein', 'Mary Shelley', '9780143131847', 279, 280, 'A pioneering science fiction novel about ambition, responsibility and the consequences of creating life.', 'https://covers.openlibrary.org/b/isbn/9780143131847-M.jpg', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1190/5/Frankenstein-1645639891.pdf', 84, 'Science Fiction'],
    ['Alice in Wonderland', 'Lewis Carroll', '9780141439761', 199, 192, 'Alice enters a strange world where language, logic and identity change at every turn.', 'https://covers.openlibrary.org/b/isbn/9780141439761-M.jpg', 'https://www.gutenberg.org/files/11/11-pdf.pdf', 11, 'Children\'s Books'],
    ['The Adventures of Sherlock Holmes', 'Arthur Conan Doyle', '9780140437711', 349, 320, 'A collection of Sherlock Holmes mysteries featuring observation, deduction and dramatic investigations.', 'https://covers.openlibrary.org/b/isbn/9780140437711-M.jpg', 'https://www.gutenberg.org/files/1661/1661-pdf.pdf', 1661, 'Mystery & Thriller'],
    ['Moby Dick', 'Herman Melville', '9780142437247', 399, 720, 'Captain Ahab leads the Pequod on a dangerous pursuit across the sea.', 'https://covers.openlibrary.org/b/isbn/9780142437247-M.jpg', 'https://www.gutenberg.org/files/2701/2701-pdf.pdf', 2701, 'Fiction'],
    ['A Tale of Two Cities', 'Charles Dickens', '9780141439600', 299, 544, 'A historical novel about sacrifice, courage and life during the French Revolution.', 'https://covers.openlibrary.org/b/isbn/9780141439600-M.jpg', 'https://www.gutenberg.org/files/98/98-pdf.pdf', 98, 'Historical Fiction'],
    ['Dracula', 'Bram Stoker', '9780141439846', 329, 416, 'An atmospheric gothic novel about Count Dracula and the people drawn into his dark world.', 'https://covers.openlibrary.org/b/isbn/9780141439846-M.jpg', 'https://www.gutenberg.org/files/345/345-pdf.pdf', 345, 'Mystery & Thriller'],
    ['Great Expectations', 'Charles Dickens', '9780141439563', 349, 544, 'Pip grows from a village boy into a young gentleman while learning what ambition and loyalty mean.', 'https://covers.openlibrary.org/b/isbn/9780141439563-M.jpg', 'https://www.gutenberg.org/files/174/174-pdf.pdf', 174, 'Historical Fiction'],
    ['Jane Eyre', 'Charlotte Bronte', '9780141441146', 329, 532, 'A coming-of-age story about independence, moral choice and belonging.', 'https://covers.openlibrary.org/b/isbn/9780141441146-M.jpg', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1241/4/Jane-Eyre-1645640567.pdf', 1260, 'Romance'],
    ['Adventures of Huckleberry Finn', 'Mark Twain', '9780142437179', 299, 368, 'Huck and Jim travel down the Mississippi in a story about friendship and freedom.', 'https://covers.openlibrary.org/b/isbn/9780142437179-M.jpg', 'https://www.gutenberg.org/files/76/76-pdf.pdf', 76, 'Historical Fiction'],
    ['War and Peace', 'Leo Tolstoy', '9780199232765', 499, 1296, 'A sweeping historical novel that follows families and friendships during the Napoleonic wars.', 'https://covers.openlibrary.org/b/isbn/9780199232765-M.jpg', 'https://www.gutenberg.org/files/2600/2600-pdf.pdf', 2600, 'History'],
    ['The Metamorphosis', 'Franz Kafka', '9780553213690', 199, 96, 'A short modern classic about identity, family responsibility and isolation.', 'https://covers.openlibrary.org/b/isbn/9780553213690-M.jpg', 'https://www.gutenberg.org/files/5200/5200-pdf.pdf', 5200, 'Philosophy'],
    ['The Secret Garden', 'Frances Hodgson Burnett', '9780142437054', 249, 320, 'A young reader discovers a hidden garden and sees how care can change a home and its people.', 'https://covers.openlibrary.org/b/isbn/9780142437054-M.jpg', 'https://www.gutenberg.org/files/17396/17396-pdf.pdf', 17396, 'Children\'s Books'],
    ['The Time Machine', 'H. G. Wells', '9780141439976', 229, 128, 'A scientist travels into the far future and finds a world shaped by time and social change.', 'https://covers.openlibrary.org/b/isbn/9780141439976-M.jpg', 'https://www.fourmilab.ch/etexts/www/wells/timemach/timemach.pdf', 35, 'Science Fiction'],
  ].map(([title, authorName, isbn13, purchasePrice, pageCount, description, coverUrl, pdfUrl, popularityScore, categoryName]) => ({
    title,
    isbn13,
    authors: [authors[authorName]?._id].filter(Boolean),
    publisher: publisher._id,
    categories: [categories[categoryName]?._id || categories.Fiction._id],
    genres: [categoryName || 'Classic Fiction'],
    publicationDate: new Date('2024-01-01'),
    pageCount,
    description,
    cover: { url: coverUrl, altText: `${title} book cover` },
    purchasePrice,
    physicalRental: { enabled: true, price: Math.max(20, Math.round(purchasePrice * 0.1)), durationDays: 14 },
    digitalRental: { enabled: true, price: Math.max(5, Math.round(purchasePrice * 0.02)), durationDays: 14 },
    digitalFormat: 'pdf',
    digitalAssetKey: pdfUrl,
    digitalEnabled: true,
    featured: popularityScore > 1000,
    tags: ['classic', 'public domain', 'recommended reading'],
    popularityScore,
  }));

  // Additional titles requested for the catalogue, plus a small curated set
  // for sections that would otherwise have no books. These are inserted only
  // when neither the ISBN nor the title already exists in the database.
  // These links are legal public-domain reading editions. Copyrighted modern
  // titles intentionally remain disabled until the owner supplies a licensed
  // PDF URL through the admin inventory form.
  const publicDomainDigitalUrls = {
    'Crime and Punishment': 'https://www.gutenberg.org/cache/epub/2554/pg2554-images.html',
    'The Brothers Karamazov': 'https://www.gutenberg.org/cache/epub/28054/pg28054-images.html',
    'The Idiot': 'https://www.gutenberg.org/cache/epub/2638/pg2638-images.html',
    'Notes from Underground': 'https://www.gutenberg.org/cache/epub/600/pg600-images.html',
    'Sense and Sensibility': 'https://www.gutenberg.org/cache/epub/161/pg161-images.html',
    Hamlet: 'https://www.gutenberg.org/cache/epub/1524/pg1524-images.html',
    'Romeo and Juliet': 'https://www.gutenberg.org/cache/epub/1112/pg1112-images.html',
    'The Jungle Book': 'https://www.gutenberg.org/cache/epub/236/pg236-images.html',
    'The Hound of the Baskervilles': 'https://www.gutenberg.org/cache/epub/2852/pg2852-images.html',
    'A Study in Scarlet': 'https://www.gutenberg.org/cache/epub/244/pg244-images.html',
  };

  const supplementalRows = [
    ['Five Point Someone', 'Chetan Bhagat', '9788129115309', 299, 270, 'Three friends navigate college pressure, friendship, and the expectations placed on young graduates.', 'Romance'],
    ['2 States: The Story of My Marriage', 'Chetan Bhagat', '9788129115507', 299, 280, 'A contemporary relationship story about family, culture, and finding common ground.', 'Romance'],
    ['The 3 Mistakes of My Life', 'Chetan Bhagat', '9788129112140', 299, 258, 'Three friends build a business while facing ambition, loyalty, and difficult choices.', 'Fiction'],
    ['Half Girlfriend', 'Chetan Bhagat', '9788129142147', 299, 272, 'A young couple crosses language, class, and distance while trying to understand love.', 'Romance'],
    ['Crime and Punishment', 'Fyodor Dostoevsky', '9780140449136', 349, 576, 'A psychologically intense novel about guilt, morality, and the possibility of redemption.', 'Philosophy'],
    ['The Brothers Karamazov', 'Fyodor Dostoevsky', '9780374528379', 449, 824, 'A profound family drama exploring faith, reason, responsibility, and human freedom.', 'Philosophy'],
    ['The Idiot', 'Fyodor Dostoevsky', '9780140447927', 349, 672, 'A compassionate man enters a society shaped by pride, money, jealousy, and conflicting ideals.', 'Philosophy'],
    ['Notes from Underground', 'Fyodor Dostoevsky', '9780140442522', 249, 160, 'A sharp, influential reflection on consciousness, freedom, and alienation.', 'Philosophy'],
    ['Sense and Sensibility', 'Jane Austen', '9780141439662', 299, 368, 'Two sisters respond differently to love, family expectations, and social pressure.', 'Romance'],
    ['The God of Small Things', 'Arundhati Roy', '9780812979653', 399, 352, 'A lyrical family story shaped by memory, social rules, and the consequences of forbidden love.', 'Fiction'],
    ['The Ministry of Utmost Happiness', 'Arundhati Roy', '9780241290082', 499, 368, 'A wide-ranging novel connecting personal lives with the political and social landscape of India.', 'Fiction'],
    ['Hamlet', 'William Shakespeare', '9780141396507', 199, 352, 'Shakespeare\'s tragedy of family, grief, revenge, and uncertainty.', 'Poetry'],
    ['Romeo and Juliet', 'William Shakespeare', '9780141396477', 199, 304, 'A classic tragedy about love, conflict, family, and the cost of division.', 'Romance'],
    ['Ikigai', 'Héctor García', '9780143452747', 299, 208, 'A practical introduction to Japanese ideas about purpose, balance, and a meaningful daily life.', 'Personal Growth'],
    ['Atomic Habits', 'James Clear', '9780735211292', 499, 320, 'A practical framework for building good habits through small, consistent improvements.', 'Personal Growth'],
    ['The Big Bang Theory', 'Simon Singh', '9780007162215', 399, 560, 'An accessible account of the evidence and ideas behind the origin and evolution of the universe.', 'Science Fiction'],
    ['The Alchemist', 'Paulo Coelho', '9780061122415', 299, 208, 'A philosophical adventure about following a dream and recognizing the meaning in a journey.', 'Fiction'],
    ['The Jungle Book', 'Rudyard Kipling', '9780141325296', 249, 288, 'Beloved stories of Mowgli, courage, friendship, and life in the jungle.', 'Children\'s Books'],
    ['The Hound of the Baskervilles', 'Arthur Conan Doyle', '9780140437506', 299, 256, 'Sherlock Holmes investigates a legendary hound and a mysterious inheritance on the moor.', 'Mystery & Thriller'],
    ['A Study in Scarlet', 'Arthur Conan Doyle', '9780140439083', 249, 192, 'The first Sherlock Holmes investigation introduces the detective and Dr. Watson.', 'Mystery & Thriller'],
    ['The Hobbit', 'J. R. R. Tolkien', '9780261102217', 399, 310, 'Bilbo Baggins leaves home for an adventure involving dwarves, dragons, and unexpected courage.', 'Fantasy'],
    ['The Lion, the Witch and the Wardrobe', 'C. S. Lewis', '9780064405058', 299, 208, 'Four children discover a magical world and stand against a tyrannical winter.', 'Fantasy'],
    ['Harry Potter and the Philosopher\'s Stone', 'J. K. Rowling', '9780747532699', 499, 352, 'A young student discovers a hidden magical world and begins an extraordinary education.', 'Fantasy'],
    ['Mythos', 'Stephen Fry', '9781452178912', 399, 352, 'A lively retelling of the Greek myths and the gods, heroes, and monsters within them.', 'Mythology & Folklore'],
    ['Norse Mythology', 'Neil Gaiman', '9780399180989', 399, 304, 'A vivid retelling of the Norse gods, their adventures, and their final battle.', 'Mythology & Folklore'],
    ['Ramayana', 'Rick Riordan', '9780143441230', 349, 416, 'A readable introduction to one of the world\'s great epic stories of duty, courage, and devotion.', 'Mythology & Folklore'],
    ['Wings of Fire', 'A. P. J. Abdul Kalam', '9788173711466', 299, 192, 'An inspiring memoir about learning, science, public service, and national ambition.', 'Biography & Memoir'],
    ['Steve Jobs', 'Walter Isaacson', '9781451648546', 599, 656, 'A detailed portrait of the innovator, entrepreneur, and complex person behind Apple.', 'Biography & Memoir'],
    ['Becoming', 'Michelle Obama', '9781524763138', 599, 448, 'A thoughtful memoir about identity, family, work, and life in public service.', 'Biography & Memoir'],
    ['Rich Dad Poor Dad', 'Robert Kiyosaki', '9781612680194', 399, 336, 'An accessible introduction to financial thinking, assets, and long-term decision-making.', 'Business & Finance'],
    ['Think and Grow Rich', 'Napoleon Hill', '9781585424337', 299, 320, 'A classic personal-success book about goals, persistence, and disciplined action.', 'Business & Finance'],
    ['The Intelligent Investor', 'Benjamin Graham', '9780060555665', 599, 640, 'A foundational guide to disciplined, long-term value investing.', 'Business & Finance'],
    ['Clean Code', 'Robert C. Martin', '9780132350884', 699, 464, 'Practical principles for writing readable, maintainable, and dependable software.', 'Technology & Computing'],
    ['The Pragmatic Programmer', 'Andrew Hunt', '9780135957059', 799, 352, 'A durable guide to thinking clearly and working effectively as a software developer.', 'Technology & Computing'],
    ['Code Complete', 'Steve McConnell', '9780735619678', 899, 960, 'Evidence-based practices for designing, constructing, and improving software.', 'Technology & Computing'],
    ['Milk and Honey', 'Rupi Kaur', '9781449474256', 299, 208, 'Concise illustrated poems about love, loss, trauma, healing, and growth.', 'Poetry'],
    ['Gitanjali', 'Rabindranath Tagore', '9780140444255', 249, 128, 'A celebrated collection of spiritual and lyrical poems by the Nobel laureate.', 'Poetry'],
    ['Leaves of Grass', 'Walt Whitman', '9780199538892', 399, 720, 'A landmark collection celebrating nature, individuality, democracy, and human connection.', 'Poetry'],
    ['Why We Sleep', 'Matthew Walker', '9781501144318', 499, 368, 'A popular science guide to the role of sleep in health, learning, and wellbeing.', 'Health & Wellness'],
    ['The Body Keeps the Score', 'Bessel van der Kolk', '9780143127741', 599, 464, 'An overview of trauma, the body, and pathways toward recovery and resilience.', 'Health & Wellness'],
    ['How Not to Die', 'Michael Greger', '9781250066114', 499, 576, 'An evidence-informed discussion of nutrition and everyday choices that support health.', 'Health & Wellness'],
    ['Around the World in Eighty Days', 'Jules Verne', '9780140449068', 249, 240, 'A fast-moving journey across countries, cultures, and unexpected obstacles.', 'Travel'],
    ['Into the Wild', 'Jon Krakauer', '9780385486804', 399, 240, 'A reported account of a young man seeking meaning through a solitary journey into nature.', 'Travel'],
    ['Eat, Pray, Love', 'Elizabeth Gilbert', '9780143038412', 399, 368, 'A memoir of travel, reflection, and rebuilding a life across three cultures.', 'Travel'],
    ['Word Power Made Easy', 'Norman Lewis', '9788183071000', 249, 560, 'A structured vocabulary builder for learners preparing for study and competitive exams.', 'Exam Preparation'],
    ['Quantitative Aptitude for Competitive Examinations', 'R. S. Aggarwal', '9789352607548', 599, 800, 'A practice-focused guide to arithmetic, data interpretation, and quantitative reasoning.', 'Exam Preparation'],
    ['Objective General English', 'S. P. Bakshi', '9789355646049', 499, 720, 'A comprehensive practice book for grammar, vocabulary, and competitive-exam English.', 'Exam Preparation'],
  ];

  const supplementalBooks = supplementalRows.map(([title, authorName, isbn13, purchasePrice, pageCount, description, categoryName]) => ({
    title,
    isbn13,
    authors: [authors[authorName]?._id].filter(Boolean),
    publisher: publisher._id,
    categories: [categories[categoryName]?._id || categories.Fiction._id],
    genres: [categoryName],
    publicationDate: new Date('2024-01-01'),
    pageCount,
    description,
    cover: { url: `https://covers.openlibrary.org/b/isbn/${isbn13}-M.jpg`, altText: `${title} book cover` },
    purchasePrice,
    physicalRental: { enabled: true, price: Math.max(20, Math.round(purchasePrice * 0.1)), durationDays: 14 },
    digitalRental: { enabled: Boolean(publicDomainDigitalUrls[title]), price: Boolean(publicDomainDigitalUrls[title]) ? Math.max(5, Math.round(purchasePrice * 0.02)) : 0, durationDays: 14 },
    digitalFormat: 'pdf',
    digitalAssetKey: publicDomainDigitalUrls[title],
    digitalEnabled: Boolean(publicDomainDigitalUrls[title]),
    featured: false,
    tags: [categoryName.toLowerCase(), 'recommended reading'],
    popularityScore: 50,
  }));

  // These open-access editions are direct PDF files, so the BookHub reader
  // can open them as PDFs instead of routing the customer to an HTML reader.
  const verifiedPdfRows = [
    ['The Picture of Dorian Gray', 'Oscar Wilde', '9780141439570', 299, 242, 'A philosophical gothic novel about beauty, influence, and the cost of a life devoted to appearances.', 'Fiction', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1308/1/The-Picture-of-Dorian-Gray-1645714877.pdf', 'https://covers.openlibrary.org/b/isbn/9780141439570-M.jpg'],
    ['The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 349, 180, 'A Jazz Age classic about ambition, memory, wealth, and the search for an idealized past.', 'Historical Fiction', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1296/1/The-Great-Gatsby-1645716675.pdf', 'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg'],
    ['The Island of Doctor Moreau', 'H. G. Wells', '9780141442380', 299, 176, 'A science-fiction journey into a remote island where scientific ambition challenges the boundaries of humanity.', 'Science Fiction', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1295/1/The-Island-of-Doctor-Moreau-1645716690.pdf', 'https://covers.openlibrary.org/b/isbn/9780141442380-M.jpg'],
    ['A Journal of the Plague Year', 'Daniel Defoe', '9780140431163', 299, 265, 'A historical account of London during the Great Plague, blending observation, memory, and social history.', 'History', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1244/7/A-Journal-of-the-Plague-Year-1645641072.pdf', 'https://covers.openlibrary.org/b/isbn/9780140431163-M.jpg'],
    ['The Strange Case of Dr. Jekyll and Mr. Hyde', 'Robert Louis Stevenson', '9780140431170', 249, 112, 'A compact gothic mystery about identity, secrecy, and the conflict between a respectable life and a darker self.', 'Mystery & Thriller', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1282/1/The-Strange-Case-of-Dr.-Jekyll-and-Mr.-Hyde-1645717467.pdf', 'https://covers.openlibrary.org/b/isbn/9780140431170-M.jpg'],
    ['The Odyssey', 'Homer', '9780140449112', 349, 320, 'An enduring epic about Odysseus, resilience, identity, and the long journey home after war.', 'Mythology & Folklore', 'https://openlibrary-repo.ecampusontario.ca/jspui/bitstream/123456789/1291/1/The-Odyssey-1645717369.pdf', 'https://covers.openlibrary.org/b/isbn/9780140449112-M.jpg'],
  ].map(([title, authorName, isbn13, purchasePrice, pageCount, description, categoryName, pdfUrl, coverUrl]) => ({
    title,
    isbn13,
    authors: [authors[authorName]?._id].filter(Boolean),
    publisher: publisher._id,
    categories: [categories[categoryName]?._id || categories.Fiction._id],
    genres: [categoryName],
    publicationDate: new Date('2024-01-01'),
    pageCount,
    description,
    cover: { url: coverUrl, altText: `${title} book cover` },
    purchasePrice,
    physicalRental: { enabled: true, price: Math.max(20, Math.round(purchasePrice * 0.1)), durationDays: 14 },
    digitalRental: { enabled: true, price: Math.max(5, Math.round(purchasePrice * 0.02)), durationDays: 14 },
    digitalFormat: 'pdf',
    digitalAssetKey: pdfUrl,
    digitalEnabled: true,
    featured: false,
    tags: [categoryName.toLowerCase(), 'public domain', 'open PDF'],
    popularityScore: 65,
  }));

  books.push(...classicBooks, ...verifiedPdfRows);

  const requestedTitles = new Set([
    ...supplementalRows.map(([title]) => title),
    'Pride and Prejudice',
    'A Tale of Two Cities',
    'Frankenstein',
    'The Adventures of Sherlock Holmes',
    ...verifiedPdfRows.map((book) => book.title),
  ].map((title) => title.toLowerCase()));

  for (const book of books) {
    book.slug = slugify(book.title);
    const existing = await Book.findOne({ $or: [{ isbn13: book.isbn13 }, { title: new RegExp(`^${escapeRegExp(book.title)}$`, 'i') }] }).select('_id title');
    if (existing && requestedTitles.has(book.title.toLowerCase())) continue;
    await Book.updateOne({ isbn13: book.isbn13 }, { $set: book }, { upsert: true, runValidators: true });
  }

  let supplementalAdded = 0;
  for (const book of supplementalBooks) {
    const existing = await Book.findOne({ $or: [{ isbn13: book.isbn13 }, { title: new RegExp(`^${escapeRegExp(book.title)}$`, 'i') }] }).select('_id title +digitalAssetKey');
    if (existing) {
      const publicDomainUrl = publicDomainDigitalUrls[book.title];
      if (publicDomainUrl && existing.digitalAssetKey !== publicDomainUrl) {
        await Book.updateOne(
          { _id: existing._id },
          { $set: { digitalAssetKey: publicDomainUrl, digitalEnabled: true, 'digitalRental.enabled': true } },
        );
      }
      continue;
    }
    book.slug = slugify(book.title);
    await Book.create(book);
    supplementalAdded += 1;
  }

  // Refresh the PDF URLs for existing classic records without overwriting
  // other owner-managed fields in the database.
  for (const book of [...classicBooks, ...verifiedPdfRows]) {
    await Book.updateOne(
      { title: new RegExp(`^${escapeRegExp(book.title)}$`, 'i') },
      { $set: { digitalAssetKey: book.digitalAssetKey, digitalEnabled: true, 'digitalRental.enabled': true } },
    );
  }

  console.info(`Seeded ${books.length} base books and added ${supplementalAdded} new requested/section books for BookHub.`);
};

seedCatalog()
  .catch((error) => {
    console.error(`Catalog seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
