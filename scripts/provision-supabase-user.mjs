import { createClient } from '@supabase/supabase-js'

const validRoles = new Set(['intercessor', 'pastor', 'prayer-core'])

function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]

    if (!current.startsWith('--')) {
      continue
    }

    const key = current.slice(2)
    const value = argv[index + 1]

    if (!value || value.startsWith('--')) {
      args[key] = true
      continue
    }

    args[key] = value
    index += 1
  }

  return args
}

function printUsage() {
  console.log(`Usage:
  npm run provision:user -- --email user@church.org --password "StrongPass123!" --role intercessor

Required environment variables:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Allowed roles:
  intercessor
  pastor
  prayer-core`)
}

async function findUserByEmail(supabase, email) {
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    })

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`)
    }

    const matchedUser = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())

    if (matchedUser) {
      return matchedUser
    }

    if (data.users.length < 100) {
      break
    }

    page += 1
  }

  return null
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const email = typeof args.email === 'string' ? args.email.trim().toLowerCase() : ''
  const password = typeof args.password === 'string' ? args.password : ''
  const role = typeof args.role === 'string' ? args.role.trim() : ''
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (args.help) {
    printUsage()
    return
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.')
  }

  if (!email || !password || !role) {
    printUsage()
    throw new Error('Missing one or more required arguments: --email, --password, --role')
  }

  if (!validRoles.has(role)) {
    throw new Error(`Invalid role "${role}". Use intercessor, pastor, or prayer-core.`)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const existingUser = await findUserByEmail(supabase, email)

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      app_metadata: {
        ...(existingUser.app_metadata ?? {}),
        role,
      },
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        role,
      },
      email_confirm: true,
    })

    if (error) {
      throw new Error(`Failed to update existing user: ${error.message}`)
    }

    console.log(`Updated user ${email} with role ${role}.`)
    return
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role,
    },
    user_metadata: {
      role,
    },
  })

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  console.log(`Created user ${data.user.email} with role ${role}.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})