import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notifySuccess, notifyError, notifyWarning } from '../lib/notify.js';

let fire;

beforeEach(() => {
  fire = vi.fn().mockResolvedValue({});
  global.Swal = { fire };
});

describe('notify helpers', () => {
  it('shows a success toast that dismisses itself', () => {
    notifySuccess('Expense saved.');

    expect(fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: 'success',
      title: 'Success',
      text: 'Expense saved.',
      // Success needs no acknowledgement, so it clears on its own rather than
      // making the user dismiss it before carrying on.
      timer: 2000,
      showConfirmButton: false
    }));
  });

  it('shows errors without a timer so they cannot be missed', () => {
    notifyError('Could not reach the server.');

    const arg = fire.mock.calls[0][0];
    expect(arg.icon).toBe('error');
    expect(arg.text).toBe('Could not reach the server.');
    expect(arg.timer).toBeUndefined();
  });

  it('shows a warning', () => {
    notifyWarning('No matching page found.');

    expect(fire).toHaveBeenCalledWith(expect.objectContaining({
      icon: 'warning',
      title: 'Warning',
      text: 'No matching page found.'
    }));
  });

  it('lets the caller override the heading', () => {
    notifySuccess('Saved.', 'Expense added');
    notifyError('Nope.', 'Could not delete');

    expect(fire.mock.calls[0][0].title).toBe('Expense added');
    expect(fire.mock.calls[1][0].title).toBe('Could not delete');
  });

  it('returns the dialog promise so callers can act after it closes', async () => {
    await expect(notifySuccess('done')).resolves.toEqual({});
  });
});
