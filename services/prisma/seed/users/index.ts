import { faker } from "@faker-js/faker"
import { hash } from "bcryptjs"

import {
	db,
	DEFAULT_PASSWORD,
	EMAIL_DOMAIN,
	SEED_RANGES,
	TEST_ACCOUNTS
} from "@/services/prisma/seed/config"
import { getRandomInRange } from "@/services/prisma/seed/utils"

export async function createUsers() {
	const hashedPassword = await hash(DEFAULT_PASSWORD, 10)

	// Create test accounts first
	console.log("Creating test accounts...")
	const testAccounts = await Promise.all(
		Object.values(TEST_ACCOUNTS).map(async (account) => {
			return db.user.create({
				data: {
					...account,
					password: hashedPassword
				}
			})
		})
	)

	console.log(`Created ${testAccounts.length} test accounts`)

	// Create additional random users
	async function createUserBatch(
		role: "CLIENT" | "ADMIN" | "SUPER_ADMIN",
		count: number
	) {
		const userData = Array.from({ length: count }, () => {
			const firstName = faker.person.firstName()
			const lastName = faker.person.lastName()
			return {
				name: `${firstName} ${lastName}`,
				email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${EMAIL_DOMAIN}`,
				password: hashedPassword,
				role,
				image: null, // Use null to fall back to placeholder.svg
				emailVerified: new Date()
			}
		})

		return db.$transaction(userData.map((data) => db.user.create({ data })))
	}

	const admin = await createUserBatch(
		"ADMIN",
		getRandomInRange(SEED_RANGES.ADMIN)
	)
	const superAdmin = await createUserBatch(
		"SUPER_ADMIN",
		getRandomInRange(SEED_RANGES.SUPER_ADMIN)
	)
	const client = await createUserBatch(
		"CLIENT",
		getRandomInRange(SEED_RANGES.CLIENT)
	)

	return {
		testAccounts: { total: testAccounts.length, items: testAccounts },
		admin: { total: admin.length, items: admin },
		superAdmin: { total: superAdmin.length, items: superAdmin },
		client: { total: client.length, items: client }
	}
}
