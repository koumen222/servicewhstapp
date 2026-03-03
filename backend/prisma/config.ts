import type { Datasource } from '@prisma/client'

export const datasource: Datasource = {
  url: process.env.DATABASE_URL!,
}
