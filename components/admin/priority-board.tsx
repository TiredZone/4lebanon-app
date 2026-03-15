'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTransition } from 'react'
import toast from 'react-hot-toast'
import { ARTICLE_PRIORITIES } from '@/lib/constants'
import { updateArticlePriority, reorderArticles } from '@/app/admin/priority/actions'
import type { UserRole } from '@/types/database'

interface PriorityArticle {
  id: string
  title_ar: string
  priority: number
  sort_position: number
  status: string
  published_at: string | null
  author: { id: string; display_name_ar: string } | null
}

interface PriorityBoardProps {
  articles: PriorityArticle[]
  userRole: UserRole
}

function SortableCard({ article }: { article: PriorityArticle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: article.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="priority-card">
      <p className="priority-card__title">{article.title_ar}</p>
      {article.author && (
        <span className="priority-card__author">{article.author.display_name_ar}</span>
      )}
    </div>
  )
}

function ArticleCard({ article }: { article: PriorityArticle }) {
  return (
    <div className="priority-card priority-card--overlay">
      <p className="priority-card__title">{article.title_ar}</p>
      {article.author && (
        <span className="priority-card__author">{article.author.display_name_ar}</span>
      )}
    </div>
  )
}

export function PriorityBoard({ articles: initialArticles, userRole }: PriorityBoardProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const minPriority = userRole === 'super_admin' ? 1 : 2

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const getArticlesByPriority = useCallback(
    (priority: number) => articles.filter((a) => a.priority === priority),
    [articles]
  )

  const activeArticle = activeId ? articles.find((a) => a.id === activeId) : null

  const findContainer = (id: string): number | null => {
    // Check if it's a column ID
    const colMatch = String(id).match(/^column-(\d+)$/)
    if (colMatch) return parseInt(colMatch[1])

    // It's an article ID - find which priority group it's in
    const article = articles.find((a) => a.id === id)
    return article ? article.priority : null
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(String(active.id))
    const overContainer = findContainer(String(over.id))

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    // Check if user can move to this priority
    if (overContainer < minPriority) return

    setArticles((prev) =>
      prev.map((a) => (a.id === String(active.id) ? { ...a, priority: overContainer } : a))
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeContainer = findContainer(String(active.id))
    const overContainer = findContainer(String(over.id))

    if (!activeContainer || !overContainer) return

    if (activeContainer === overContainer) {
      // Reorder within same column
      const columnArticles = getArticlesByPriority(activeContainer)
      const oldIndex = columnArticles.findIndex((a) => a.id === String(active.id))
      const overArticle = columnArticles.find((a) => a.id === String(over.id))
      const newIndex = overArticle ? columnArticles.indexOf(overArticle) : oldIndex

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(columnArticles, oldIndex, newIndex)
        setArticles((prev) => {
          const others = prev.filter((a) => a.priority !== activeContainer)
          return [...others, ...reordered]
        })

        startTransition(async () => {
          const result = await reorderArticles(
            reordered.map((a) => a.id),
            activeContainer
          )
          if (result.error) toast.error(result.error)
        })
      }
    } else {
      // Moved to different column - priority changed
      if (overContainer < minPriority) return

      startTransition(async () => {
        const result = await updateArticlePriority(String(active.id), overContainer)
        if (result.error) {
          toast.error(result.error)
          // Revert
          setArticles(initialArticles)
        }
      })
    }
  }

  return (
    <div className={`priority-board ${isPending ? 'priority-board--saving' : ''}`}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {ARTICLE_PRIORITIES.map((p) => {
          const columnArticles = getArticlesByPriority(p.value)
          const isLocked = p.value < minPriority

          return (
            <div
              key={p.value}
              className={`priority-column ${isLocked ? 'priority-column--locked' : ''}`}
            >
              <div className="priority-column__header" style={{ borderColor: p.color }}>
                <span className="priority-column__dot" style={{ backgroundColor: p.color }} />
                <span className="priority-column__label">{p.label}</span>
                <span className="priority-column__count">{columnArticles.length}</span>
              </div>

              <SortableContext
                id={`column-${p.value}`}
                items={columnArticles.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="priority-column__body" id={`column-${p.value}`}>
                  {columnArticles.length > 0 ? (
                    columnArticles.map((article) => (
                      <SortableCard key={article.id} article={article} />
                    ))
                  ) : (
                    <div className="priority-column__empty">لا توجد مقالات</div>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}

        <DragOverlay>{activeArticle ? <ArticleCard article={activeArticle} /> : null}</DragOverlay>
      </DndContext>
    </div>
  )
}
