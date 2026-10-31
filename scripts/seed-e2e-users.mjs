import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";

const require = createRequire(import.meta.url);
const fixtures = require("../tests/e2e-users.json");
const daycareId = "8f0e5c6a-1b2d-4c3e-9a10-2d3e4f5a6b70";

const supabaseUrl = process.env.E2E_SUPABASE_URL;
const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Local Supabase E2E credentials are missing.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  throw listError;
}

for (const fixture of Object.values(fixtures)) {
  const existingUser = userList.users.find(
    (user) => user.email?.toLowerCase() === fixture.email.toLowerCase(),
  );

  if (existingUser) {
    const { error } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (error) throw error;
  }

  const metadata = {
    daycare_id: daycareId,
    role: fixture.role,
    full_name: fixture.fullName,
  };
  const { data, error } = await supabase.auth.admin.createUser({
    email: fixture.email,
    password: fixture.password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }

  if (fixture.status === "pending") {
    const { error: profileError } = await supabase
      .from("users")
      .update({ status: "pending" })
      .eq("id", data.user.id);

    if (profileError) throw profileError;
  }

  if (fixture.missingProfile) {
    const { error: profileError } = await supabase
      .from("users")
      .delete()
      .eq("id", data.user.id);

    if (profileError) throw profileError;
  }

  if (fixture.metadataRoleOverride) {
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      data.user.id,
      {
        user_metadata: {
          ...metadata,
          role: fixture.metadataRoleOverride,
        },
      },
    );

    if (metadataError) throw metadataError;
  }
}

console.log("Local Supabase E2E users are ready.");
