import * as migration_20260624_105831_init from './20260624_105831_init';
import * as migration_20260629_111417 from './20260629_111417';

export const migrations = [
  {
    up: migration_20260624_105831_init.up,
    down: migration_20260624_105831_init.down,
    name: '20260624_105831_init',
  },
  {
    up: migration_20260629_111417.up,
    down: migration_20260629_111417.down,
    name: '20260629_111417'
  },
];
