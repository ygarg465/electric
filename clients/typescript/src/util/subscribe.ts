import { QualifiedTablename, hasIntersection } from '.'
import { LiveResult, LiveResultUpdate } from '../client/model/model'
import { Notifier, UnsubscribeFunction } from '../notifiers'

export type LiveResultSubscribeFunction<T> = (
  handler: (resultUpdate: LiveResultUpdate<T>) => void
) => UnsubscribeFunction

/**
 * Generates a function that allows a client to subscribe to updates
 * to results generated by a given `liveQuery`. An update with the full
 * query result will occur anytime a table touched by the query is updated.
 *
 * @returns A function to unsubscribe from query result updates
 */
export function createQueryResultSubscribeFunction<T>(
  notifier: Notifier,
  liveQuery: () => Promise<LiveResult<T>>,
  relevantTablenames?: QualifiedTablename[]
): LiveResultSubscribeFunction<T> {
  return (handler) => {
    let cancelled = false
    const update = async () => {
      try {
        const res = await liveQuery()
        if (cancelled) return
        relevantTablenames ??= res.tablenames
        handler({ results: res.result, updatedAt: new Date() })
      } catch (err) {
        if (cancelled) return
        handler({ error: err, updatedAt: new Date() })
      }
    }

    // call once upon subscribing to deliver most recent result
    update()

    // subscribe to subsequent changes to relevant tables
    const unsubscribe = notifier.subscribeToDataChanges((notification) => {
      const changedTablenames = notifier.alias(notification)
      if (
        relevantTablenames &&
        hasIntersection(relevantTablenames, changedTablenames)
      )
        update()
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }
}
