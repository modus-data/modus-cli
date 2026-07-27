import { ux } from '@oclif/core'

const MODUS_WORDMARK = [
  ' __  __   ___   ____   _   _   ____  ',
  '|  \\/  | / _ \\ |  _ \\ | | | |/ ___| ',
  '| |\\/| || | | || | | || | | |\\___ \\ ',
  '| |  | || |_| || |_| || |_| | ___) |',
  '|_|  |_| \\___/ |____/  \\___/ |____/ ',
].join('\n')

/** Colorized "MODUS" wordmark banner, printed once at the start of an interactive login. */
export const MODUS_LOGO = ux.colorize('cyan', MODUS_WORDMARK)
