import type { MetaResponse } from "@/lib/schemas/meta";
import { json, route } from "@/server/http/handler";
import { metaService } from "@/server/services/meta";

export const GET = route(async (_request, { container }) => json<MetaResponse>(await metaService(container).get()));
