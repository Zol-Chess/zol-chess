import { NextRequest, NextResponse } from "next/server";

import { clientPromise } from "@/lib/mongodb";
import { catchErr } from "@/utils/error-handlers";
