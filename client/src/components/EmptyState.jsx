import { SearchX } from 'lucide-react'

function EmptyState({ title = 'Nothing found', message = 'Try another search or filter.' }) {
  return (
    <section className="empty-state">
      <SearchX size={34} />
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  )
}

export default EmptyState
