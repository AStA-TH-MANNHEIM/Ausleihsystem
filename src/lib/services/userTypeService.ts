import { UserTypeSchema, type UserTypeType } from '$lib/generated/zod';

export function getUserTypePriviligeArray(userType: UserTypeType): UserTypeType[] {
	const cleanUserType: UserTypeType = UserTypeSchema.parse(userType);
	const userTypeArray = Object.values(UserTypeSchema.Enum);
	return userTypeArray.slice(0, userTypeArray.indexOf(cleanUserType) + 1);
}

export function inferUserType(email: string): UserTypeType {
	switch (true) {
		case /@stud\.hs-mannheim\.de$/.test(email):
			console.log('Studenten-E-Mail-Adresse erkannt.');
			return UserTypeSchema.Enum.StudentIn;

		case /fachschaft-.@hs-mannheim\.de$/.test(email):
			console.log('Fachschaft-E-Mail-Adresse erkannt.');
			return UserTypeSchema.Enum.Fachschaft;

		case /\.asta@hs-mannheim\.de$/.test(email):
			console.log('AStA-E-Mail-Adresse erkannt.');
			return UserTypeSchema.Enum.AStA;

		case /@hs-mannheim\.de$/.test(email):
			console.log('TH-E-Mail-Adresse erkannt.');
			return UserTypeSchema.Enum.Sonstige;

		default:
			console.log('Unbekannte E-Mail-Domain.');
			return UserTypeSchema.Enum.Sonstige;
	}
}
