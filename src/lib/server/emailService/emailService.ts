import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';
import { type Ausleihe } from '$lib/generated/zod';
import { prisma } from '../db/prismaConnection';
import { AusleihStatusSchema, type AusleihStatusType } from '$lib/generated/zod';
const AusleihStatus = AusleihStatusSchema.Enum;
import { logger } from '$lib/logger';
import { formatDiffForEmail, type ChangeEntry } from '../changeLogService';

const fromData = '"AStA TH Mannheim" <' + env.ES_USER + '>';
const domain = env.DOMAIN;
// development and debug where I don't want to send out dozens of emails
const isEsDisabled = env.ES_DISABLED === 'TRUE';

function genTransporter() {
	const isSecure = env.ES_SECURE === 'TRUE';

	return nodemailer.createTransport({
		host: env.ES_HOST,
		port: isSecure ? 465 : 587,
		secure: isSecure,

		auth: {
			user: env.ES_USER,
			pass: env.ES_PASSWORD
		}
	});
}

async function sendMail(email) {
	if (isEsDisabled) {
		return {
			accepted: [email],
			rejected: [],
			messageId: 'mocked-message-id',
			response: 'Email service disabled, mock response.'
		};
	} else {
		const transporter = genTransporter();
		return await transporter.sendMail(email);
	}
}

export async function sendVerifyEmail(email: string, r_hash: string) {
	// TODO: get db  ausleihen die noch unvalidiert sind und die email haben
	// pro anmeldung eine email senden (ittr)
	//let info = await transporter.sendMail(generateVerifyEmail(email, r_hash));
	try {
		// const info = await transporter.sendMail(generateVerifyEmail(email, r_hash));
		const info = await sendMail(generateVerifyEmail(email, r_hash));
		logger.debug('Email sent:', info.messageId);
		console.log('Verify Email sent: %s %s', email, r_hash);
	} catch (error) {
		if (error.code === 'ECONNECTION') {
			logger.error('SMTP connection failed.');
		} else if (error.responseCode === 535) {
			logger.error('Authentication failed.');
		} else if (error.responseCode === 550) {
			logger.error('Invalid email domain.');
			throw new Error('Ungültige Email-Adresse (550)');
		} else {
			logger.error('Unknown error:', error.message);
		}
		throw new Error('EMail konnte nicht gesendet werden!');
	}
}

export async function sendStatusChangeEmail(ausleihe: Ausleihe) {
	try {
		//await transporter.sendMail(statusChangeEmail(ausleihe));
		await sendMail(statusChangeEmail(ausleihe));
	} catch (e) {
		logger.error('Err sending Status email', e);
		throw new Error('Sending email failed');
	}

	console.log('Email:StatusChange %s %s', ausleihe.id);
}

export async function sendReservationEmail(ausleihe: Ausleihe) {
	try {
		await sendMail(reservationEmail(ausleihe));
	} catch (e) {
		logger.error('Err sending Status email', e);
		throw new Error('Sending email failed');
	}

	console.log('Email:BookingLink %s %s', ausleihe.id);
}

export async function sendZuweisungsEmail(ausleihe: Ausleihe) {
	const betreuerIds = [ausleihe.assignedUserAusgabeId, ausleihe.assignedUserAbholungId].filter(Boolean);

	if (betreuerIds.length === 0) {
		return;
	}

	// Deduplicate in case both are the same user
	const uniqueIds = [...new Set(betreuerIds)];

	for (const betreuerId of uniqueIds) {
		const betreungsEmail = await prisma.user
			.findFirst({
				where: { id: betreuerId },
				select: { email: true }
			})
			.then((data) => {
				return data?.email;
			});

		if (!betreungsEmail) {
			continue;
		}

		try {
			await sendMail(zuweisungsEmail(ausleihe, betreungsEmail));
		} catch (e) {
			logger.error('Err sending Zuweisungs email', e);
			throw new Error('Sending email failed');
		}

		console.log('Email:Zuweisung %s an %s', ausleihe.id, betreuerId);
	}
}

export async function sendActionRequiredEmail(ausleihe: Ausleihe) {
	try {
		const email = actionRequiredEmail(ausleihe);
		const info = await sendMail(email);
		logger.debug('Email sent:', info.messageId);
		console.log('Action Required Email sent: %s %s', email);
	} catch (e) {
		logger.error('Err sending email', e);
		throw new Error('Sending failed');
	}

	console.log('Email:ActionRequiredEmail %s %s', ausleihe.id);
}

function generateVerifyEmail(empfänger: string, r_hash: string) {
	return {
		from: fromData, // Absender-Adresse
		to: empfänger,
		subject: 'Ausleihe verifizieren',
		text: 'meow',
		html:
			'<h1>Bitte verifiziere deinen Antrag</h1>' +
			'<p>Vielen Dank für deinen Ausleihantrag.<br> Bitte klicke auf den untenstehenden Link, um deinen Antrag zu verifizieren und den Ausleihprozess abzuschließen.</p>' +
			'<p><a href="' +
			domain +
			'/reservation/' +
			r_hash +
			'">' +
			r_hash +
			'</a></p>' +
			'</a></p><p>Wenn du diesen Antrag nicht gestellt hast, ignoriere bitte diese E-Mail.</p>' +
			'<p>Viele Grüße,<br>Dein AStA</p>'
	};
}

const reservationEmail = (ausleihe: Ausleihe) => {
	return {
		from: fromData, // Absender-Adresse
		to: ausleihe.email,
		subject: 'Bestätigung erforderlich, Status des Ausleiheantrags: ' + ausleihe.ausleihStatus,
		text: 'meow',
		html:
			'<h1>Status deines Ausleihantrags:<br> ' +
			ausleihe.ausleihStatus +
			'</h1><p>Möglicherweise wurden nicht alle beantragten Gegenstände deines Ausleihantrags genehmigt.<br> Bitte klicke auf den untenstehenden Link, um deinen Ausleihantrag einzusehen und dort zu <b>buchen</b>.</p><p><a href="' +
			domain +
			'/reservation/' +
			ausleihe.id +
			'">' +
			ausleihe.id +
			'</a></p><p>Viele Grüße,<br>Dein AStA</p>'
	};
};

const statusChangeEmail = (ausleihe: Ausleihe) => {
	return {
		from: fromData, // Absender-Adresse
		to: ausleihe.email,
		subject: 'Ausleihstatus geändert: ' + ausleihe.ausleihStatus,
		text: 'meow',
		html:
			'<h1>Neuer Status deines Ausleihantrags:<br> ' +
			ausleihe.ausleihStatus +
			'</h1><p>Der Status deines Ausleihantrags wurde geändert.<br> Bitte klicke auf den untenstehenden Link, um deinen Ausleihantrag einzusehen.</p><p><a href="' +
			domain +
			'/reservation/' +
			ausleihe.id +
			'">' +
			ausleihe.id +
			'</a></p><p>Viele Grüße,<br>Dein AStA</p>'
	};
};

const zuweisungsEmail = (ausleihe: Ausleihe, betreungsEmail: string) => {
	return {
		from: fromData, // Absender-Adresse
		to: betreungsEmail,
		subject: 'Ausleihe zugewiesen ' + ausleihe.id,
		text: 'meow',
		html:
			'<h1>Dir wurde eine Ausleihe zugewiesen</h1>' +
			'<p>Antragstellung erfolgt durch: ' +
			ausleihe.vorname +
			' ' +
			ausleihe.nachname +
			'</p>' +
			'<p>von ' +
			ausleihe.startDate +
			' bis ' +
			ausleihe.endDate +
			'.</p>' +
			'<p>Bitte setze dich mit der Person, die den Antrag gestellt hat, in Verbindung, um einen Übergabezeitpunkt auszumachen.</p>' +
			'<p>Klicke auf den untenstehenden Link, um den Ausleihantrag einzusehen.</p><p><a href="' +
			domain +
			'/admin/reservations/' +
			ausleihe.id +
			'">' +
			ausleihe.id +
			'</a></p><p>Viele Grüße,<br>Dein AStA-Ausleihsystem</p>'
	};
};

const actionRequiredEmail = (ausleihe: Ausleihe) => {
	var subjectText =
		'Ausleihe(' + ausleihe.ausleihStatus + ') erfordert eine Aktion: ' + ausleihe.id;
	var actionText = 'bearbeiten';
	if (ausleihe.ausleihStatus === AusleihStatus.Verifiziert) {
		subjectText = 'Neue Ausleihe(' + ausleihe.ausleihStatus + ') : ' + ausleihe.id;
		actionText = 'genehmigen und zu reservieren';
	} else if (ausleihe.ausleihStatus === AusleihStatus.Gebucht) {
		subjectText =
			'Für Ausleihe(' +
			ausleihe.ausleihStatus +
			') muss Übergabe geplant und durchgeführt werden: ' +
			ausleihe.id;
	}
	return {
		from: fromData, // Absender-Adresse
		// to: "ausleihe.asta@th-mannheim.de, s.matthes@kooperationen.hs-mannheim.de",
		//to: "ausleihe.asta@th-mannheim.de",
		//to: "s.matthes@kooperationen.hs-mannheim.de",
		to: env.ES_AUSLEIHE_TEAM || 'ausleihe.asta@th-mannheim.de',
		subject: subjectText,
		text: 'Ausleihe erfordert Aktion',
		html:
			'<h1>Folgende Ausleihe erfordert eine Aktion!</h1>' +
			'<p>Antragstellung erfolgt durch: ' +
			ausleihe.vorname +
			' ' +
			ausleihe.nachname +
			'</p>' +
			'<p>von ' +
			ausleihe.startDate +
			' bis ' +
			ausleihe.endDate +
			'.</p>' +
			'<p>Klicke auf den untenstehenden Link, um die Ausleihe zu ' +
			actionText +
			'.</p><p><a href="' +
			domain +
			'/admin/reservations/' +
			ausleihe.id +
			'">' +
			ausleihe.id +
			'</a></p><p>Viele Grüße,<br>Dein AStA-Ausleihsystem</p>'
	};
};

export async function sendPendingChangeConfirmationEmail(
	ausleihe: Ausleihe,
	token: string,
	diff: ChangeEntry[]
) {
	try {
		await sendMail(pendingChangeConfirmationEmail(ausleihe, token, diff));
		console.log('Email:PendingChangeConfirmation %s', ausleihe.id);
	} catch (e) {
		logger.error('Err sending pending change confirmation email', e);
		throw new Error('Sending pending change confirmation email failed');
	}
}

export async function sendPendingChangeAppliedEmail(ausleihe: Ausleihe, diff: ChangeEntry[]) {
	try {
		await sendMail(pendingChangeAppliedEmail(ausleihe, diff));
		console.log('Email:PendingChangeApplied %s', ausleihe.id);
	} catch (e) {
		logger.error('Err sending pending change applied email', e);
		throw new Error('Sending pending change applied email failed');
	}
}

export async function sendAdminChangeInfoEmail(
	ausleihe: Ausleihe,
	diff: ChangeEntry[],
	adminName: string,
	adminNote?: string | null
) {
	try {
		await sendMail(adminChangeInfoEmail(ausleihe, diff, adminName, adminNote));
		console.log('Email:AdminChangeInfo %s', ausleihe.id);
	} catch (e) {
		logger.error('Err sending admin change info email', e);
		throw new Error('Sending admin change info email failed');
	}
}

const pendingChangeConfirmationEmail = (
	ausleihe: Ausleihe,
	token: string,
	diff: ChangeEntry[]
) => {
	const confirmUrl = `${domain}/reservation/${ausleihe.id}/confirm-change/${token}`;
	return {
		from: fromData,
		to: ausleihe.email,
		subject: 'Bitte bestätige deine Änderung am Ausleihantrag ' + ausleihe.id,
		text: 'Bitte bestätige deine Änderung über folgenden Link: ' + confirmUrl,
		html:
			'<h1>Bestätige deine Änderung</h1>' +
			'<p>Du hast Änderungen an deinem Ausleihantrag vorgeschlagen. Damit diese wirksam werden, klicke bitte auf den Bestätigungs-Link.</p>' +
			'<p><strong>Vorgeschlagene Änderungen:</strong></p>' +
			formatDiffForEmail(diff) +
			'<p><a href="' +
			confirmUrl +
			'" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Änderung bestätigen</a></p>' +
			'<p style="color:#888;font-size:12px;">Oder kopiere diesen Link: ' +
			confirmUrl +
			'</p>' +
			'<p>Wenn du diese Änderung nicht angefordert hast, ignoriere diese E-Mail. Solange du nicht bestätigst, bleibt dein Antrag unverändert.</p>' +
			'<p>Viele Grüße,<br>Dein AStA</p>'
	};
};

const pendingChangeAppliedEmail = (ausleihe: Ausleihe, diff: ChangeEntry[]) => {
	return {
		from: fromData,
		to: ausleihe.email,
		subject: 'Deine Änderung am Ausleihantrag wurde übernommen: ' + ausleihe.id,
		text: 'Deine Änderungen wurden übernommen.',
		html:
			'<h1>Änderung übernommen</h1>' +
			'<p>Deine Änderungen an deinem Ausleihantrag wurden erfolgreich übernommen:</p>' +
			formatDiffForEmail(diff) +
			'<p><a href="' +
			domain +
			'/reservation/' +
			ausleihe.id +
			'">Antrag ansehen</a></p>' +
			'<p>Viele Grüße,<br>Dein AStA</p>'
	};
};

const adminChangeInfoEmail = (
	ausleihe: Ausleihe,
	diff: ChangeEntry[],
	adminName: string,
	adminNote?: string | null
) => {
	const notePart = adminNote
		? `<p><strong>Notiz vom Admin (${adminName}):</strong><br>${adminNote.replace(/\n/g, '<br>')}</p>`
		: '';
	return {
		from: fromData,
		to: ausleihe.email,
		subject: 'Dein Ausleihantrag wurde durch das Ausleihteam angepasst: ' + ausleihe.id,
		text: 'Dein Ausleihantrag wurde durch das Ausleihteam angepasst.',
		html:
			'<h1>Änderung an deinem Ausleihantrag</h1>' +
			'<p>Das Ausleihteam hat deinen Antrag angepasst. Du musst nichts tun – diese E-Mail dient nur zur Information.</p>' +
			'<p><strong>Geänderte Felder:</strong></p>' +
			formatDiffForEmail(diff) +
			notePart +
			'<p><a href="' +
			domain +
			'/reservation/' +
			ausleihe.id +
			'">Antrag ansehen</a></p>' +
			'<p>Falls du Rückfragen hast, antworte einfach auf diese E-Mail.</p>' +
			'<p>Viele Grüße,<br>Dein AStA</p>'
	};
};

export async function sendReservationEditedEmail(ausleihe: Ausleihe, previousStatus: string) {
	try {
		const email = reservationEditedEmail(ausleihe, previousStatus);
		const info = await sendMail(email);
		logger.debug('Reservation Edited Email sent:', info.messageId);
		console.log('Reservation Edited Email sent: %s', ausleihe.id);
	} catch (e) {
		logger.error('Err sending reservation edited email', e);
		throw new Error('Sending reservation edited email failed');
	}
}

const reservationEditedEmail = (ausleihe: Ausleihe, previousStatus: string) => {
	return {
		from: fromData,
		to: env.ES_AUSLEIHE_TEAM || 'ausleihe.asta@th-mannheim.de',
		subject: 'Ausleihe wurde bearbeitet: ' + ausleihe.id,
		text: 'Ausleihe wurde bearbeitet',
		html:
			'<h1>Eine Ausleihe wurde bearbeitet!</h1>' +
			'<p>Antragstellung erfolgt durch: ' +
			ausleihe.vorname +
			' ' +
			ausleihe.nachname +
			'</p>' +
			'<p>von ' +
			ausleihe.startDate +
			' bis ' +
			ausleihe.endDate +
			'.</p>' +
			'<p>Der Status wurde von <strong>' +
			previousStatus +
			'</strong> auf <strong>Verifiziert</strong> zurückgesetzt.</p>' +
			'<p>Klicke auf den untenstehenden Link, um die Ausleihe erneut zu prüfen und zu genehmigen.</p>' +
			'<p><a href="' +
			domain +
			'/admin/reservations/' +
			ausleihe.id +
			'">' +
			ausleihe.id +
			'</a></p>' +
			'<p>Viele Grüße,<br>Dein AStA-Ausleihsystem</p>'
	};
};
