import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db/prismaConnection";
import { error } from "@sveltejs/kit";
import PdfPrinter from "pdfmake";

const fonts = {
	Roboto: {
		normal: "node_modules/pdfmake/build/vfs_fonts/Roboto-Regular.ttf",
		bold: "node_modules/pdfmake/build/vfs_fonts/Roboto-Medium.ttf",
		italics: "node_modules/pdfmake/build/vfs_fonts/Roboto-Italic.ttf",
		bolditalics: "node_modules/pdfmake/build/vfs_fonts/Roboto-MediumItalic.ttf",
	},
};

const statusLabels: Record<string, string> = {
	Angemeldet: "Angemeldet",
	Verifiziert: "Warten auf Genehmigung",
	Reserviert: "Reserviert",
	Gebucht: "Bereit zur Abholung",
	ImGange: "Im Gange",
	Abgeschlossen: "Abgeschlossen",
	AbgeschlUnvollst: "Unvollständig",
	Storniert: "Storniert",
};

export const GET: RequestHandler = async ({ params }) => {
	const reservation = await prisma.ausleihe.findUnique({
		where: { id: params.r_hash },
		include: {
			AusleiheItems: {
				include: { item: { include: { Standort: true } } },
			},
		},
	});

	if (!reservation) {
		throw error(404, "Ausleihe nicht gefunden");
	}

	const printer = new PdfPrinter(fonts);

	const itemTableBody: any[][] = [
		[
			{ text: "Inventarnr.", style: "tableHeader" },
			{ text: "Artikelname", style: "tableHeader" },
			{ text: "Bezeichnung", style: "tableHeader" },
			{ text: "Standort", style: "tableHeader" },
			{ text: "Beantragt", style: "tableHeader", alignment: "right" },
			{ text: "Genehmigt", style: "tableHeader", alignment: "right" },
		],
	];

	for (const ai of reservation.AusleiheItems) {
		itemTableBody.push([
			{ text: ai.item.id, font: "Roboto", fontSize: 8 },
			ai.item.articleName,
			ai.item.bezeichnung,
			ai.item.Standort?.standort || "—",
			{ text: String(ai.beantragt), alignment: "right" },
			{ text: String(ai.genehmigt), alignment: "right" },
		]);
	}

	const docDefinition: any = {
		content: [
			{ text: "Ausleihschein", style: "header" },
			{ text: `Status: ${statusLabels[reservation.ausleihStatus] || reservation.ausleihStatus}`, style: "subheader" },
			{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#cccccc" }], margin: [0, 5, 0, 10] },

			{ text: "Kontaktdaten", style: "sectionHeader" },
			{
				columns: [
					{
						width: "50%",
						table: {
							widths: ["auto", "*"],
							body: [
								[{ text: "Name:", style: "label" }, `${reservation.vorname} ${reservation.nachname}`],
								[{ text: "E-Mail:", style: "label" }, reservation.email],
								[{ text: "Telefon:", style: "label" }, reservation.phone || "—"],
							],
						},
						layout: "noBorders",
					},
					{
						width: "50%",
						table: {
							widths: ["auto", "*"],
							body: [
								[{ text: "Verwendungszweck:", style: "label" }, reservation.reason || "—"],
								[{ text: "Verwendungsort:", style: "label" }, reservation.verwendungsort || "—"],
								...(reservation.abholort ? [[{ text: "Abholort:", style: "label" }, reservation.abholort]] : []),
							],
						},
						layout: "noBorders",
					},
				],
				margin: [0, 0, 0, 15],
			},

			{ text: "Zeitraum", style: "sectionHeader" },
			{
				columns: [
					{
						width: "50%",
						table: {
							widths: ["auto", "*"],
							body: [
								[{ text: "Ausleihe von:", style: "label" }, reservation.startDate || "—"],
								[{ text: "Ausleihe bis:", style: "label" }, reservation.endDate || "—"],
							],
						},
						layout: "noBorders",
					},
					{
						width: "50%",
						table: {
							widths: ["auto", "*"],
							body: [
								[{ text: "Event von:", style: "label" }, reservation.verwendungsStart || "—"],
								[{ text: "Event bis:", style: "label" }, reservation.verwendungsEnd || "—"],
							],
						},
						layout: "noBorders",
					},
				],
				margin: [0, 0, 0, 15],
			},

			{ text: `Items (${reservation.AusleiheItems.length})`, style: "sectionHeader" },
			{
				table: {
					headerRows: 1,
					widths: ["auto", "*", "*", "auto", 50, 50],
					body: itemTableBody,
				},
				layout: {
					hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
					vLineWidth: () => 0,
					hLineColor: (i: number) => (i <= 1 ? "#333333" : "#dddddd"),
					paddingLeft: () => 6,
					paddingRight: () => 6,
					paddingTop: () => 4,
					paddingBottom: () => 4,
				},
				margin: [0, 0, 0, 20],
			},

			{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: "#cccccc" }], margin: [0, 20, 0, 10] },

			{
				columns: [
					{
						width: "50%",
						stack: [
							{ text: "Unterschrift Ausgabe:", style: "label", margin: [0, 0, 0, 30] },
							{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
						],
					},
					{
						width: "50%",
						stack: [
							{ text: "Unterschrift Abholung:", style: "label", margin: [0, 0, 0, 30] },
							{ canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
						],
					},
				],
			},
		],
		styles: {
			header: { fontSize: 20, bold: true, margin: [0, 0, 0, 5] },
			subheader: { fontSize: 11, color: "#666666", margin: [0, 0, 0, 5] },
			sectionHeader: { fontSize: 13, bold: true, margin: [0, 0, 0, 8], color: "#333333" },
			label: { bold: true, fontSize: 9, color: "#555555" },
			tableHeader: { bold: true, fontSize: 9, color: "#ffffff", fillColor: "#444444" },
		},
		defaultStyle: { fontSize: 10 },
		footer: (currentPage: number, pageCount: number) => ({
			text: `Seite ${currentPage} von ${pageCount} | Erstellt am ${new Date().toLocaleDateString("de-DE")}`,
			alignment: "center",
			fontSize: 8,
			color: "#999999",
			margin: [0, 10, 0, 0],
		}),
	};

	const pdfDoc = printer.createPdfKitDocument(docDefinition);

	const chunks: Buffer[] = [];
	pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));

	const pdfBuffer = await new Promise<Buffer>((resolve) => {
		pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
		pdfDoc.end();
	});

	const filename = `Ausleihe_${reservation.vorname}_${reservation.nachname}_${reservation.startDate || "undatiert"}.pdf`;

	return new Response(pdfBuffer, {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${filename}"`,
		},
	});
};
