import { faker } from "@faker-js/faker"

export function getRandomInRange([min, max]: readonly [
	number,
	number
]): number {
	return faker.number.int({ min, max })
}
