import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const AusleiheScalarFieldEnumSchema = z.enum(['id','startDate','endDate','ausleihStatus','timestamp','email','vorname','nachname','phone','reason','verwendungsort','verwendungsStart','verwendungsEnd','abholort','pfandBetrag','pfandStatus','assignedUserAusgabeId','assignedUserAbholungId','deleteMe']);

export const AusleiheCommentScalarFieldEnumSchema = z.enum(['id','ausleiheId','timestamp','author','login','hidden','content']);

export const AusleiheChangeLogScalarFieldEnumSchema = z.enum(['id','ausleiheId','timestamp','source','actorName','actorId','changes','proposedData','adminNote','status','confirmationToken','confirmedAt','resolvedAt']);

export const AusleiheItemScalarFieldEnumSchema = z.enum(['id','beantragt','genehmigt','zurueckgebracht','ausleiheId','itemId']);

export const ItemScalarFieldEnumSchema = z.enum(['id','articleName','bezeichnung','kaufdatum','kaufpreis','description','quantity','defectQuantity','itemStatus','standortId']);

export const TagScalarFieldEnumSchema = z.enum(['id','name','description']);

export const ItemTagScalarFieldEnumSchema = z.enum(['itemId','tagId']);

export const StandortScalarFieldEnumSchema = z.enum(['id','standort']);

export const UserScalarFieldEnumSchema = z.enum(['id','username','email','passwordHash','protected','isAdmin','createdById']);

export const SessionScalarFieldEnumSchema = z.enum(['id','userId','expiresAt']);

export const LenderTypeScalarFieldEnumSchema = z.enum(['id','name','description']);

export const LenderTypePatternScalarFieldEnumSchema = z.enum(['id','lenderTypeId','pattern']);

export const ItemLenderTypeScalarFieldEnumSchema = z.enum(['itemId','lenderTypeId']);

export const ItemComponentScalarFieldEnumSchema = z.enum(['id','name','description','quantity','itemId']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const ItemStatusSchema = z.enum(['Verfuegbar','Defekt','Gesperrt','Verloren','WartungErforderlich','Aussortiert']);

export type ItemStatusType = `${z.infer<typeof ItemStatusSchema>}`

export const UserTypeSchema = z.enum(['Sonstige','StudentIn','Fachschaft','AStA']);

export type UserTypeType = `${z.infer<typeof UserTypeSchema>}`

export const AusleihStatusSchema = z.enum(['Angemeldet','Verifiziert','Reserviert','Gebucht','ImGange','Abgeschlossen','AbgeschlUnvollst','Storniert']);

export type AusleihStatusType = `${z.infer<typeof AusleihStatusSchema>}`

export const PfandStatusSchema = z.enum(['PfandNichtFestgelegt','PfandBezahlt','PfandZurueckgegeben']);

export type PfandStatusType = `${z.infer<typeof PfandStatusSchema>}`

export const ChangeSourceSchema = z.enum(['USER','ADMIN']);

export type ChangeSourceType = `${z.infer<typeof ChangeSourceSchema>}`

export const ChangeLogStatusSchema = z.enum(['PENDING','APPLIED','SUPERSEDED','CANCELLED']);

export type ChangeLogStatusType = `${z.infer<typeof ChangeLogStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// AUSLEIHE SCHEMA
/////////////////////////////////////////

export const AusleiheSchema = z.object({
  ausleihStatus: AusleihStatusSchema,
  pfandStatus: PfandStatusSchema.nullable(),
  id: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  timestamp: z.coerce.date(),
  email: z.string().email({ message: "Bitte gib eine gültige E-Mail-Adresse an." }).refine((val) => val.endsWith('hs-mannheim.de') || val.endsWith('stud.hs-mannheim.de'), { message: 'Die Email muss mit "hs-mannheim.de" oder "stud.hs-mannheim.de" enden.' }),
  vorname: z.string().min(1, { message: "Bitte gib deinen Vornamen an." }),
  nachname: z.string().min(1, { message: "Bitte gib deinen Nachnamen an." }),
  phone: z.string(),
  reason: z.string().min(1, { message: "Bitte gib einen Verwendungszweck an." }),
  verwendungsort: z.string(),
  verwendungsStart: z.string(),
  verwendungsEnd: z.string(),
  abholort: z.string().nullable(),
  pfandBetrag: z.number().nullable(),
  assignedUserAusgabeId: z.string().nullable(),
  assignedUserAbholungId: z.string().nullable(),
  deleteMe: z.boolean(),
})

export type Ausleihe = z.infer<typeof AusleiheSchema>

/////////////////////////////////////////
// AUSLEIHE COMMENT SCHEMA
/////////////////////////////////////////

export const AusleiheCommentSchema = z.object({
  id: z.number().int(),
  ausleiheId: z.string(),
  timestamp: z.coerce.date(),
  author: z.string(),
  login: z.string().nullable(),
  hidden: z.boolean(),
  content: z.string(),
})

export type AusleiheComment = z.infer<typeof AusleiheCommentSchema>

/////////////////////////////////////////
// AUSLEIHE CHANGE LOG SCHEMA
/////////////////////////////////////////

export const AusleiheChangeLogSchema = z.object({
  source: ChangeSourceSchema,
  status: ChangeLogStatusSchema,
  id: z.number().int(),
  ausleiheId: z.string(),
  timestamp: z.coerce.date(),
  actorName: z.string(),
  actorId: z.string().nullable(),
  /**
   * JSON-Array: [{ field, label, oldValue, newValue }]
   */
  changes: JsonValueSchema,
  /**
   * JSON-Snapshot der vom User vorgeschlagenen Werte (nur bei PENDING/SUPERSEDED relevant)
   */
  proposedData: JsonValueSchema.nullable(),
  adminNote: z.string().nullable(),
  confirmationToken: z.string().nullable(),
  confirmedAt: z.coerce.date().nullable(),
  resolvedAt: z.coerce.date().nullable(),
})

export type AusleiheChangeLog = z.infer<typeof AusleiheChangeLogSchema>

/////////////////////////////////////////
// AUSLEIHE ITEM SCHEMA
/////////////////////////////////////////

export const AusleiheItemSchema = z.object({
  id: z.number().int(),
  beantragt: z.number().int(),
  genehmigt: z.number().int(),
  zurueckgebracht: z.number().int(),
  ausleiheId: z.string(),
  itemId: z.string(),
})

export type AusleiheItem = z.infer<typeof AusleiheItemSchema>

/////////////////////////////////////////
// ITEM SCHEMA
/////////////////////////////////////////

export const ItemSchema = z.object({
  itemStatus: ItemStatusSchema,
  id: z.string().regex(/^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])-\d{2}$/, {message: "Bitte nutze die Inventarnummer im Format: YYYYMMDD-NN",}),
  articleName: z.string().min(1, {message:"Bitte gib einen Namen ein."}),
  bezeichnung: z.string().min(1, {message:"Bitte gib eine Bezeichnung ein."}),
  kaufdatum: z.coerce.date().nullable(),
  kaufpreis: z.number().min(0).nullable(),
  description: z.string(),
  quantity: z.number().min(1),
  defectQuantity: z.number().min(0),
  standortId: z.number().int().nullable(),
})

export type Item = z.infer<typeof ItemSchema>

/////////////////////////////////////////
// TAG SCHEMA
/////////////////////////////////////////

export const TagSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, {message:"Bitte gib einen Tag-Namen ein."}),
  description: z.string().nullable(),
})

export type Tag = z.infer<typeof TagSchema>

/////////////////////////////////////////
// ITEM TAG SCHEMA
/////////////////////////////////////////

export const ItemTagSchema = z.object({
  itemId: z.string(),
  tagId: z.number().int(),
})

export type ItemTag = z.infer<typeof ItemTagSchema>

/////////////////////////////////////////
// STANDORT SCHEMA
/////////////////////////////////////////

export const StandortSchema = z.object({
  id: z.number().int(),
  standort: z.string(),
})

export type Standort = z.infer<typeof StandortSchema>

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email({ message: "Bitte gib eine gültige Email an." }).refine((val) => val.endsWith('hs-mannheim.de') || val.endsWith('stud.hs-mannheim.de'), { message: 'Die Email muss mit "hs-mannheim.de" oder "stud.hs-mannheim.de" enden.' }),
  passwordHash: z.string(),
  protected: z.boolean(),
  isAdmin: z.boolean(),
  createdById: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
})

export type Session = z.infer<typeof SessionSchema>

/////////////////////////////////////////
// LENDER TYPE SCHEMA
/////////////////////////////////////////

export const LenderTypeSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
})

export type LenderType = z.infer<typeof LenderTypeSchema>

/////////////////////////////////////////
// LENDER TYPE PATTERN SCHEMA
/////////////////////////////////////////

export const LenderTypePatternSchema = z.object({
  id: z.number().int(),
  lenderTypeId: z.number().int(),
  pattern: z.string(),
})

export type LenderTypePattern = z.infer<typeof LenderTypePatternSchema>

/////////////////////////////////////////
// ITEM LENDER TYPE SCHEMA
/////////////////////////////////////////

export const ItemLenderTypeSchema = z.object({
  itemId: z.string(),
  lenderTypeId: z.number().int(),
})

export type ItemLenderType = z.infer<typeof ItemLenderTypeSchema>

/////////////////////////////////////////
// ITEM COMPONENT SCHEMA
/////////////////////////////////////////

export const ItemComponentSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, {message:"Bitte gib einen Namen ein."}),
  description: z.string(),
  quantity: z.number().min(1),
  itemId: z.string(),
})

export type ItemComponent = z.infer<typeof ItemComponentSchema>
