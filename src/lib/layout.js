// Bento layout maths, kept out of the component so it can be reasoned about
// (and tested) on its own.

const PATTERN = [8, 4, 12] // large feature, narrow companion, full-width band
const COLUMNS = 12

/**
 * Column spans for a 12-column grid. The repeating 8/4/12 pattern tiles
 * perfectly in threes; whatever is left over on the final row is absorbed by
 * the last card so the grid never ends with a hole.
 */
export function computeSpans(count) {
  if (count <= 0) return []
  if (count === 1) return [COLUMNS]
  // Two projects should read as peers. The old 7/5 split made the narrow card
  // much shorter and left a large empty area inside the stretched grid row.
  if (count === 2) return [6, 6]

  const spans = []
  let used = 0

  for (let index = 0; index < count; index += 1) {
    const span = PATTERN[index % PATTERN.length]
    if (used + span > COLUMNS) used = 0
    spans.push(span)
    used = (used + span) % COLUMNS
  }

  if (used !== 0) {
    spans[count - 1] += COLUMNS - used
  }

  return spans
}

/**
 * Card treatment. Driven by category first, then position — never random, so
 * the same project always looks the same.
 */
export function variantFor(work, index, span) {
  if (work.category === 'Achievements') return 'lime'
  if (index === 0) return 'featured'
  if (span >= 12) return 'band'
  return 'deep'
}
