import { db } from "./config"
import { createUsers } from "./users"

async function main() {
	console.log("\n=== 🌱 Starting Database Seed ===\n")

	try {
		// Clean existing data
		console.log("Cleaning existing data...")
		await db.$transaction([db.user.deleteMany()])

		// Create entities
		console.log("Creating users...")
		const userStats = await createUsers()

		// Output final stats
		const stats = {
			testAccounts: userStats.testAccounts.total,
			users: {
				admins: userStats.admin.total,
				superAdmins: userStats.superAdmin.total,
				clients: userStats.client.total
			},
			total:
				userStats.testAccounts.total +
				userStats.admin.total +
				userStats.superAdmin.total +
				userStats.client.total
		}

		console.log("\n=== 🌱 Database Seed Complete ===")
		console.log("\nStatistics:")
		console.log(`\tTest Accounts: ${stats.testAccounts}`)
		console.log(`\tAdmins: ${stats.users.admins}`)
		console.log(`\tSuper Admins: ${stats.users.superAdmins}`)
		console.log(`\tClients: ${stats.users.clients}`)
		console.log(`\tTotal Users: ${stats.total}`)
		console.log("\n")
	} catch (error) {
		console.error("Seed failed:", error)
		process.exit(1)
	}
}

main()
	.catch((error) => {
		console.error("Fatal error:", error)
		process.exit(1)
	})
	.finally(() => {
		void (async () => {
			await db.$disconnect()
		})()
	})
