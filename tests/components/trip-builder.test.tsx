import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { TripRequest } from '../../src/domain/types'
import { TripBuilder } from '../../src/components/TripBuilder'

describe('TripBuilder', () => {
  it('submits the fixed judge scenario from accessible controls', async () => {
    const user = userEvent.setup()
    let submitted: TripRequest | undefined
    render(<TripBuilder onSubmit={(request) => { submitted = request }} isPlanning={false} />)

    await user.click(screen.getByRole('button', { name: '生成行程' }))

    expect(submitted).toMatchObject({
      start: '温州南站',
      adults: 1,
      children: 1,
      seniors: 1,
      budget: 1200,
      preferences: ['山水', '古村'],
      walkingLevel: 'low',
      notes: '希望节奏轻松，午餐尝试永嘉小吃',
    })
  })

  it('lets a traveler request a real five-day itinerary', async () => {
    const user = userEvent.setup()
    let submitted: TripRequest | undefined
    render(<TripBuilder onSubmit={(request) => { submitted = request }} isPlanning={false} />)

    await user.clear(screen.getByRole('spinbutton', { name: '行程天数' }))
    await user.type(screen.getByRole('spinbutton', { name: '行程天数' }), '5')
    await user.click(screen.getByRole('button', { name: '生成行程' }))

    expect(submitted?.days).toBe(5)
  })
})
