// =========================================
// PROFILE PAGE
// =========================================

const PROFILE_TABLE = "profiles";
const AVATAR_BUCKET = "avatars";
const DEFAULT_AVATAR = "/website-icons/avatar.png";

let currentUser = null;
let currentProfile = null;

// =========================================
// ELEMENTS
// =========================================

const profileAvatar = document.getElementById("profileAvatar");
const profilePictureInput = document.getElementById("profilePictureInput");

const uploadProfilePicture = document.getElementById("uploadProfilePicture");

const deleteProfilePicture = document.getElementById("deleteProfilePicture");

// =========================================
// STATUS MESSAGE
// =========================================

function showProfileMessage(message, isError = false) {
  let messageElement = document.getElementById("profileImageMessage");

  if (!messageElement) {
    messageElement = document.createElement("p");
    messageElement.id = "profileImageMessage";
    messageElement.className = "mt-2 text-[11px]";
    document
      .getElementById("profilePictureActions")
      ?.appendChild(messageElement);
  }

  messageElement.textContent = message;
  messageElement.classList.toggle("text-red-400", isError);
  messageElement.classList.toggle("text-green-400", !isError);
}

// =========================================
// MAKE PROFILE FIELDS READ-ONLY
// =========================================

function makeProfileReadOnly() {
  const profileCard = document.getElementById("profileCard");

  if (!profileCard) return;

  // Text and email fields
  profileCard
    .querySelectorAll(
      "input:not([type='file']):not([type='checkbox']), textarea",
    )
    .forEach((field) => {
      field.readOnly = true;
      field.setAttribute("aria-readonly", "true");
      field.classList.add("cursor-default");
    });

  // Dropdowns
  profileCard.querySelectorAll("select").forEach((field) => {
    field.disabled = true;
    field.classList.add("cursor-not-allowed", "opacity-100");
  });

  // Toggles
  profileCard.querySelectorAll("input[type='checkbox']").forEach((field) => {
    field.disabled = true;
  });

  // Hide profile save/reset controls, if present.
  document.getElementById("profileActionButtons")?.classList.add("hidden");
}

// =========================================
// GET AUTH DISPLAY NAME
// =========================================

function getAuthName(user) {
  const metadata = user.user_metadata || {};

  return metadata.full_name || metadata.name || metadata.user_name || "";
}

// =========================================
// GET PROVIDER AVATAR
// =========================================

function getProviderAvatar(user) {
  const metadata = user.user_metadata || {};

  return metadata.avatar_url || metadata.picture || metadata.avatar || null;
}

// =========================================
// POPULATE PROFILE FIELDS
// =========================================

function setFieldValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    if (element.type === "checkbox") {
      element.checked = Boolean(value);
    } else {
      element.value = value ?? "";
    }
  }
}

function populateProfile(user, profile) {
  const authName = getAuthName(user);
  const nameParts = authName.trim().split(/\s+/);

  // Support either a single full-name field
  // or separate first and last name fields.
  setFieldValue("fullName", authName);
  setFieldValue("firstName", nameParts[0] || "");
  setFieldValue("lastName", nameParts.slice(1).join(" "));

  // Email comes directly from Supabase Auth.
  setFieldValue("primaryEmail", user.email || "");

  // Remaining details come from public.profiles.
  setFieldValue("preferredName", profile.preferred_name);
  setFieldValue("username", profile.username);
  setFieldValue("role", profile.role);
  setFieldValue("website", profile.website);
  setFieldValue("bio", profile.bio);

  setFieldValue("language", profile.language);
  setFieldValue("landingView", profile.landing_view);
  setFieldValue("digestCadence", profile.digest_cadence);

  // Display avatar.
  updateAvatarDisplay(user, profile);
}

// =========================================
// DISPLAY AVATAR
// =========================================

function updateAvatarDisplay(user, profile) {
  if (!profileAvatar) return;

  // If the user explicitly removed their image,
  // show the local default avatar.
  if (profile.avatar_removed) {
    profileAvatar.src = DEFAULT_AVATAR;
    return;
  }

  // A custom uploaded image takes priority.
  if (profile.avatar_path) {
    const { data } = supabaseClient.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(profile.avatar_path);

    profileAvatar.src = data.publicUrl;
    return;
  }

  // Otherwise use the Google/GitHub profile image.
  const providerAvatar = getProviderAvatar(user);

  profileAvatar.src = providerAvatar || DEFAULT_AVATAR;

  profileAvatar.onerror = () => {
    profileAvatar.onerror = null;
    profileAvatar.src = DEFAULT_AVATAR;
  };
}

// =========================================
// LOAD PROFILE
// =========================================

async function loadProfile() {
  makeProfileReadOnly();

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    window.location.href = "/signin.html";
    return;
  }

  currentUser = user;

  const { data: profile, error: profileError } = await supabaseClient
    .from(PROFILE_TABLE)
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile load error:", profileError);
    showProfileMessage("Unable to load profile information.", true);
    return;
  }

  currentProfile = profile;
  populateProfile(user, profile);
}

// =========================================
// OPEN FILE PICKER
// =========================================

uploadProfilePicture?.addEventListener("click", () => {
  profilePictureInput?.click();
});

// =========================================
// UPLOAD PROFILE PICTURE
// =========================================

profilePictureInput?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];

  if (!file || !currentUser || !currentProfile) return;

  const allowedTypes = ["image/png", "image/jpeg"];

  if (!allowedTypes.includes(file.type)) {
    showProfileMessage("Please select a PNG or JPG image.", true);
    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showProfileMessage("Image must be smaller than 5 MB.", true);
    event.target.value = "";
    return;
  }

  uploadProfilePicture.disabled = true;
  showProfileMessage("Uploading profile picture...");

  const extension = file.type === "image/png" ? "png" : "jpg";

  const newPath = `${currentUser.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  // Upload the new image.
  const { error: uploadError } = await supabaseClient.storage
    .from(AVATAR_BUCKET)
    .upload(newPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Avatar upload error:", uploadError);
    showProfileMessage("Image upload failed.", true);
    uploadProfilePicture.disabled = false;
    event.target.value = "";
    return;
  }

  // Save only the avatar fields in the profile row.
  const oldPath = currentProfile.avatar_path;

  const { error: updateError } = await supabaseClient
    .from(PROFILE_TABLE)
    .update({
      avatar_path: newPath,
      avatar_removed: false,
    })
    .eq("id", currentUser.id);

  if (updateError) {
    console.error("Avatar profile update error:", updateError);

    // Remove the newly uploaded file if the DB update fails.
    await supabaseClient.storage.from(AVATAR_BUCKET).remove([newPath]);

    showProfileMessage("Could not save the new profile picture.", true);
    uploadProfilePicture.disabled = false;
    event.target.value = "";
    return;
  }

  currentProfile.avatar_path = newPath;
  currentProfile.avatar_removed = false;

  updateAvatarDisplay(currentUser, currentProfile);

  // Remove the old custom image after the new one is saved.
  if (oldPath) {
    const { error: removeError } = await supabaseClient.storage
      .from(AVATAR_BUCKET)
      .remove([oldPath]);

    if (removeError) {
      console.warn("Old avatar could not be removed:", removeError);
    }
  }

  showProfileMessage("Profile picture updated.");
  uploadProfilePicture.disabled = false;
  event.target.value = "";
});

// =========================================
// DELETE PROFILE PICTURE
// =========================================

deleteProfilePicture?.addEventListener("click", async () => {
  if (!currentUser || !currentProfile) return;

  deleteProfilePicture.disabled = true;
  showProfileMessage("Removing profile picture...");

  const oldPath = currentProfile.avatar_path;

  // Save the removal state first.
  const { error } = await supabaseClient
    .from(PROFILE_TABLE)
    .update({
      avatar_path: null,
      avatar_removed: true,
    })
    .eq("id", currentUser.id);

  if (error) {
    console.error("Avatar delete error:", error);
    showProfileMessage("Could not remove profile picture.", true);
    deleteProfilePicture.disabled = false;
    return;
  }

  currentProfile.avatar_path = null;
  currentProfile.avatar_removed = true;

  // Show the default image, even if the user has a
  // Google or GitHub profile picture.
  updateAvatarDisplay(currentUser, currentProfile);

  // Remove the old custom image from Storage.
  if (oldPath) {
    const { error: removeError } = await supabaseClient.storage
      .from(AVATAR_BUCKET)
      .remove([oldPath]);

    if (removeError) {
      console.warn("Storage cleanup failed:", removeError);
    }
  }

  showProfileMessage("Profile picture removed.");
  deleteProfilePicture.disabled = false;
});

// =========================================
// INITIALIZE
// =========================================

loadProfile();
