const fallbackImages = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&fm=webp&w=640&q=60',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&fm=webp&w=640&q=60',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&fm=webp&w=640&q=60',
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&fm=webp&w=640&q=60',
  'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&fm=webp&w=640&q=60',
]

const namedImages = {
  academic: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&fm=webp&w=640&q=60',
  'classic-fiction': 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?auto=format&fit=crop&fm=webp&w=640&q=60',
  fiction: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&fm=webp&w=640&q=60',
  fictional: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&fm=webp&w=640&q=60',
  motivation: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&fm=webp&w=640&q=60',
}

function normalizeImageUrl(source) {
  if (!source) return source
  try {
    const url = new URL(source)
    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('auto', 'format')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('fm', 'webp')
      url.searchParams.set('w', '640')
      url.searchParams.set('q', '60')
    }
    if (url.hostname === 'covers.openlibrary.org') {
      url.pathname = url.pathname.replace(/-(?:S|L)\.jpg$/i, '-M.jpg')
    }
    return url.toString()
  } catch {
    return source
  }
}

export function getCategoryImage(category, index = 0) {
  const source = namedImages[category?.slug] || category?.imageUrl || fallbackImages[index % fallbackImages.length]
  return normalizeImageUrl(source)
}

export function getCoverImage(url) {
  return normalizeImageUrl(url)
}

export function getCoverCandidates(book) {
  const isbn = String(book?.isbn13 || book?.isbn10 || '').replace(/[^0-9X]/gi, '')
  const candidates = [
    getCoverImage(book?.cover?.url),
    isbn ? `https://covers.openlibrary.org/isbn/${isbn}-M.jpg` : null,
    getCategoryImage(book?.categories?.[0]),
  ]
  return candidates.filter((source, index) => source && candidates.indexOf(source) === index)
}
