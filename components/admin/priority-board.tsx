'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import {
  ARTICLE_PRIORITIES,
  PINNED_BOOST_DURATION_MS,
  BREAKING_BOOST_DURATION_MS,
} from '@/lib/constants'
import { saveAllPriorities } from '@/app/admin/priority/actions'
import type { UserRole } from '@/types/database'

function getBoostStatus(article: PriorityArticle): {
  isActive: boolean
  remainingMs: number
  label: string
} | null {
  // Priority 1 (pinned) has 48h boost, priority 2 (breaking) has 24h boost
  if (article.priority > 2 || !article.published_at) return null
  const age = Date.now() - new Date(article.published_at).getTime()
  const duration = article.priority === 1 ? PINNED_BOOST_DURATION_MS : BREAKING_BOOST_DURATION_MS
  const remaining = duration - age
  if (remaining > 0) {
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return {
      isActive: true,
      remainingMs: remaining,
      label: hours > 0 ? `${hours} س ${minutes} د` : `${minutes} د`,
    }
  }
  return { isActive: false, remainingMs: 0, label: 'انتهت فترة التعزيز' }
}

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

function BoostBadge({ article }: { article: PriorityArticle }) {
  const boost = getBoostStatus(article)
  if (!boost) return null

  return (
    <span
      className={`priority-card__boost ${boost.isActive ? 'priority-card__boost--active' : 'priority-card__boost--expired'}`}
    >
      {boost.isActive ? `⏱ ينتهي خلال ${boost.label}` : `⚠ ${boost.label}`}
    </span>
  )
}

function CardMeta({ article }: { article: PriorityArticle }) {
  return (
    <div className="priority-card__meta">
      {article.author && (
        <span className="priority-card__author">{article.author.display_name_ar}</span>
      )}
      {article.published_at && (
        <span className="priority-card__date">
          {new Date(article.published_at).toLocaleDateString('ar-LB', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </span>
      )}
    </div>
  )
}

function SortableCard({ article }: { article: PriorityArticle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: article.id,
  })

  const boost = getBoostStatus(article)
  const isExpired = boost && !boost.isActive

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : isExpired ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`priority-card ${isExpired ? 'priority-card--expired' : ''}`}
    >
      <p className="priority-card__title">{article.title_ar}</p>
      <CardMeta article={article} />
      <BoostBadge article={article} />
    </div>
  )
}

function ArticleCard({ article }: { article: PriorityArticle }) {
  return (
    <div className="priority-card priority-card--overlay">
      <p className="priority-card__title">{article.title_ar}</p>
      <CardMeta article={article} />
      <BoostBadge article={article} />
    </div>
  )
}

function DroppableColumn({ priority, children }: { priority: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${priority}`,
  })

  return (
    <div
      ref={setNodeRef}
      className={`priority-column__body ${isOver ? 'priority-column__body--over' : ''}`}
    >
      {children}
    </div>
  )
}

// Custom collision detection: prefer sortable items (for reorder within column),
// fall back to droppable columns (for cross-column and empty column drops)
const customCollision: CollisionDetection = (args) => {
  // First try pointerWithin — works great for dropping into containers
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) {
    // Prefer sortable items over containers for within-column reorder
    const itemCollision = pointerCollisions.find((c) => !String(c.id).startsWith('column-'))
    if (itemCollision) return [itemCollision]
    return pointerCollisions
  }

  // Fall back to rectIntersection for edge cases
  return rectIntersection(args)
}

export function PriorityBoard({ articles: initialArticles, userRole }: PriorityBoardProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [savedArticles, setSavedArticles] = useState(initialArticles)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [breakingFilter, setBreakingFilter] = useState<'all' | 'active' | 'expired'>('all')

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

  const hasChanges = (() => {
    if (articles.length !== savedArticles.length) return true
    for (let i = 0; i < articles.length; i++) {
      const current = articles[i]
      const saved = savedArticles.find((a) => a.id === current.id)
      if (!saved || saved.priority !== current.priority) return true
    }
    for (const p of ARTICLE_PRIORITIES) {
      const currentIds = articles.filter((a) => a.priority === p.value).map((a) => a.id)
      const savedIds = savedArticles.filter((a) => a.priority === p.value).map((a) => a.id)
      if (currentIds.length !== savedIds.length) return true
      for (let i = 0; i < currentIds.length; i++) {
        if (currentIds[i] !== savedIds[i]) return true
      }
    }
    return false
  })()

  const findContainer = (id: string): number | null => {
    const colMatch = String(id).match(/^column-(\d+)$/)
    if (colMatch) return parseInt(colMatch[1])
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
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    const changes: Array<{ id: string; priority: number; sortIndex: number }> = []
    for (const p of ARTICLE_PRIORITIES) {
      const groupArticles = articles.filter((a) => a.priority === p.value)
      groupArticles.forEach((article, index) => {
        changes.push({ id: article.id, priority: p.value, sortIndex: index })
      })
    }

    const result = await saveAllPriorities(changes)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('تم حفظ الترتيب بنجاح')
      setSavedArticles([...articles])
    }

    setIsSaving(false)
  }

  const handleReset = () => {
    setArticles(savedArticles)
  }

  return (
    <div className="priority-board">
      <DndContext
        sensors={sensors}
        collisionDetection={customCollision}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {ARTICLE_PRIORITIES.map((p) => {
          const allColumnArticles = getArticlesByPriority(p.value)
          const isLocked = p.value < minPriority
          const isBreakingColumn = p.value === 2

          // Apply filter for breaking column
          let columnArticles = allColumnArticles
          let activeCount = 0
          let expiredCount = 0

          if (isBreakingColumn) {
            for (const a of allColumnArticles) {
              const boost = getBoostStatus(a)
              if (boost?.isActive) activeCount++
              else expiredCount++
            }
            if (breakingFilter === 'active') {
              columnArticles = allColumnArticles.filter((a) => {
                const boost = getBoostStatus(a)
                return boost?.isActive ?? false
              })
            } else if (breakingFilter === 'expired') {
              columnArticles = allColumnArticles.filter((a) => {
                const boost = getBoostStatus(a)
                return boost ? !boost.isActive : true
              })
            }
          }

          return (
            <div
              key={p.value}
              className={`priority-column ${isLocked ? 'priority-column--locked' : ''}`}
            >
              <div className="priority-column__header" style={{ borderColor: p.color }}>
                <span className="priority-column__dot" style={{ backgroundColor: p.color }} />
                <span className="priority-column__label">{p.label}</span>
                <span className="priority-column__count">{allColumnArticles.length}</span>
              </div>

              {/* Filter toggle for breaking column */}
              {isBreakingColumn && allColumnArticles.length > 0 && (
                <div className="priority-column__filters">
                  <button
                    type="button"
                    className={`priority-column__filter-btn ${breakingFilter === 'all' ? 'priority-column__filter-btn--active' : ''}`}
                    onClick={() => setBreakingFilter('all')}
                  >
                    الكل ({allColumnArticles.length})
                  </button>
                  <button
                    type="button"
                    className={`priority-column__filter-btn ${breakingFilter === 'active' ? 'priority-column__filter-btn--active' : ''}`}
                    onClick={() => setBreakingFilter('active')}
                  >
                    نشط ({activeCount})
                  </button>
                  <button
                    type="button"
                    className={`priority-column__filter-btn ${breakingFilter === 'expired' ? 'priority-column__filter-btn--active' : ''}`}
                    onClick={() => setBreakingFilter('expired')}
                  >
                    منتهي ({expiredCount})
                  </button>
                </div>
              )}

              <SortableContext
                items={columnArticles.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn priority={p.value}>
                  {columnArticles.length > 0 ? (
                    columnArticles.map((article) => (
                      <SortableCard key={article.id} article={article} />
                    ))
                  ) : (
                    <div className="priority-column__empty">لا توجد مقالات</div>
                  )}
                </DroppableColumn>
              </SortableContext>
            </div>
          )
        })}

        <DragOverlay>{activeArticle ? <ArticleCard article={activeArticle} /> : null}</DragOverlay>
      </DndContext>

      {hasChanges && (
        <div className="priority-save-bar">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="priority-save-bar__reset"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="priority-save-bar__save"
          >
            {isSaving ? (
              <>
                <svg className="priority-save-bar__spinner" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="31.4 31.4"
                  />
                </svg>
                جاري الحفظ...
              </>
            ) : (
              'حفظ التغييرات'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
