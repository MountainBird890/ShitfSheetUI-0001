import { Type, type Static } from "@sinclair/typebox";

export const SearchQuery = Type.Object({
    q: Type.Optional(Type.String()),
});

export type SearchQueryType = Static<typeof SearchQuery>;