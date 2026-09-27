// =========================================
// LAPS — PROFILE PAGE
// =========================================

const PROFILE_TABLE = "profiles";
const AVATAR_BUCKET = "avatars";
const DEFAULT_AVATAR = "/website-icons/avatar.png";

let currentUser = null;
let currentProfile = null;
let isAvatarProcessing = false;

// =========================================
// ELEMENTS
// =========================================

const profilePage = document.getElementById("profilePage");
const profileAvatar = document.getElementById("profileAvatar");
const profilePictureInput = document.getElementById("profilePictureInput");
const uploadProfilePicture = document.getElementById("uploadProfilePicture");
const deleteProfilePicture = document.getElementById("deleteProfilePicture");

// =========================================
// AUTHENTICATION
// =========================================

async function checkAuthentication() {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("Authentication error:", error);
      return null;
    }

    return user || null;
  } catch (error) {
    console.error("Authentication check failed:", error);
    return null;
  }
}

// =========================================
// PROFILE MESSAGE
// =========================================

function showProfileMessage(message, isError = false) {
  let messageElement = document.getElementById("profileImageMessage");

  if (!messageElement) {
    messageElement = document.createElement("p");
    messageElement.id = "profileImageMessage";
    messageElement.className = "mt-2 text-[11px]";
    messageElement.setAttribute("aria-live", "polite");

    const buttonContainer = uploadProfilePicture?.parentElement;

    if (!buttonContainer) return;

    buttonContainer.appendChild(messageElement);
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
  const preferencesCard = document.getElementById("preferencesCard");

  [profileCard, preferencesCard].forEach((card) => {
    if (!card) return;

    card
      .querySelectorAll(
        "input:not([type='file']):not([type='checkbox']), textarea",
      )
      .forEach((field) => {
        field.readOnly = true;
        field.setAttribute("aria-readonly", "true");
        field.classList.add("cursor-default");
      });

    card.querySelectorAll("select").forEach((field) => {
      field.disabled = true;
      field.classList.add("cursor-not-allowed", "opacity-100");
    });

    card.querySelectorAll("input[type='checkbox']").forEach((field) => {
      field.disabled = true;
    });
  });

  // Hide Save and Cancel buttons.
  document.getElementById("profileActionButtons")?.classList.add("hidden");
}

// =========================================
// AUTH USER INFORMATION
// =========================================

function getAuthName(user) {
  const metadata = user.user_metadata || {};

  return metadata.full_name || metadata.name || metadata.user_name || "";
}

function getProviderAvatar(user) {
  const metadata = user.user_metadata || {};

  return metadata.avatar_url || metadata.picture || metadata.avatar || null;
}

// =========================================
// SET INPUT VALUE
// =========================================

function setFieldValue(id, value) {
  const element = document.getElementById(id);

  if (!element) return;

  if (element.type === "checkbox") {
    element.checked = Boolean(value);
  } else {
    element.value = value ?? "";
  }
}

// =========================================
// POPULATE PROFILE
// =========================================

function populateProfile(user, profile) {
  // Supabase Auth information
  setFieldValue("fullName", getAuthName(user));
  setFieldValue("primaryEmail", user.email || "");

  // Profile information
  setFieldValue("preferredName", profile.preferred_name);
  setFieldValue("username", profile.username);
  setFieldValue("role", profile.role);
  setFieldValue("website", profile.website);
  setFieldValue("bio", profile.bio);

  // Preferences
  setFieldValue("language", profile.language);
  setFieldValue("landingView", profile.landing_view);
  setFieldValue("digestCadence", profile.digest_cadence);

  // Avatar
  updateAvatarDisplay(user, profile);
}

// =========================================
// DISPLAY PROFILE AVATAR
// =========================================

function updateAvatarDisplay(user, profile) {
  if (!profileAvatar) return;

  profileAvatar.onerror = () => {
    profileAvatar.onerror = null;
    profileAvatar.src = DEFAULT_AVATAR;
  };

  // User explicitly removed their avatar.
  if (profile.avatar_removed) {
    profileAvatar.src = DEFAULT_AVATAR;
    return;
  }

  // Custom uploaded avatar.
  if (profile.avatar_path) {
    const { data } = supabaseClient.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(profile.avatar_path);

    profileAvatar.src = data.publicUrl;
    return;
  }

  // Google or GitHub avatar.
  profileAvatar.src = getProviderAvatar(user) || DEFAULT_AVATAR;
}

// =========================================
// LOAD PROFILE
// =========================================

async function loadProfile(user) {
  const { data: profile, error } = await supabaseClient
    .from(PROFILE_TABLE)
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile load error:", error);
    throw new Error("Unable to load your profile.");
  }

  if (!profile) {
    throw new Error("Your profile could not be found.");
  }

  currentUser = user;
  currentProfile = profile;

  populateProfile(user, profile);
}

// =========================================
// UPLOAD BUTTON
// =========================================

uploadProfilePicture?.addEventListener("click", () => {
  if (isAvatarProcessing || !currentUser) return;

  profilePictureInput?.click();
});

// =========================================
// UPLOAD PROFILE PICTURE
// =========================================

profilePictureInput?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];

  if (!file || !currentUser || !currentProfile) return;
  if (isAvatarProcessing) return;

  // Validate image type.
  const allowedTypes = ["image/png", "image/jpeg"];

  if (!allowedTypes.includes(file.type)) {
    showProfileMessage("Please select a PNG or JPG image.", true);
    event.target.value = "";
    return;
  }

  // Maximum file size: 5 MB.
  if (file.size > 5 * 1024 * 1024) {
    showProfileMessage("Image must be smaller than 5 MB.", true);
    event.target.value = "";
    return;
  }

  isAvatarProcessing = true;

  if (uploadProfilePicture) {
    uploadProfilePicture.disabled = true;
  }

  if (deleteProfilePicture) {
    deleteProfilePicture.disabled = true;
  }

  showProfileMessage("Uploading profile picture...");

  const extension = file.type === "image/png" ? "png" : "jpg";
  const newPath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;
  const oldPath = currentProfile.avatar_path;

  try {
    // Upload new image.
    const { error: uploadError } = await supabaseClient.storage
      .from(AVATAR_BUCKET)
      .upload(newPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Update profile record.
    const { error: updateError } = await supabaseClient
      .from(PROFILE_TABLE)
      .update({
        avatar_path: newPath,
        avatar_removed: false,
      })
      .eq("id", currentUser.id);

    if (updateError) {
      // Clean up new image if database update fails.
      await supabaseClient.storage.from(AVATAR_BUCKET).remove([newPath]);

      throw updateError;
    }

    // Update local data.
    currentProfile.avatar_path = newPath;
    currentProfile.avatar_removed = false;

    // Display the new image.
    updateAvatarDisplay(currentUser, currentProfile);

    // Remove previous custom image.
    if (oldPath) {
      const { error: removeError } = await supabaseClient.storage
        .from(AVATAR_BUCKET)
        .remove([oldPath]);

      if (removeError) {
        console.warn("Old avatar could not be removed:", removeError);
      }
    }

    showProfileMessage("Profile picture updated.");
  } catch (error) {
    console.error("Avatar upload error:", error);
    showProfileMessage(error.message || "Image upload failed.", true);
  } finally {
    isAvatarProcessing = false;

    if (uploadProfilePicture) {
      uploadProfilePicture.disabled = false;
    }

    if (deleteProfilePicture) {
      deleteProfilePicture.disabled = false;
    }

    event.target.value = "";
  }
});

// =========================================
// DELETE PROFILE PICTURE
// =========================================

deleteProfilePicture?.addEventListener("click", async () => {
  if (!currentUser || !currentProfile) return;
  if (isAvatarProcessing) return;

  isAvatarProcessing = true;

  if (deleteProfilePicture) {
    deleteProfilePicture.disabled = true;
  }

  if (uploadProfilePicture) {
    uploadProfilePicture.disabled = true;
  }

  showProfileMessage("Removing profile picture...");

  const oldPath = currentProfile.avatar_path;

  try {
    // Update the database first.
    const { error: updateError } = await supabaseClient
      .from(PROFILE_TABLE)
      .update({
        avatar_path: null,
        avatar_removed: true,
      })
      .eq("id", currentUser.id);

    if (updateError) {
      throw updateError;
    }

    // Update local data.
    currentProfile.avatar_path = null;
    currentProfile.avatar_removed = true;

    // Display default avatar.
    updateAvatarDisplay(currentUser, currentProfile);

    // Remove old custom avatar from Storage.
    if (oldPath) {
      const { error: removeError } = await supabaseClient.storage
        .from(AVATAR_BUCKET)
        .remove([oldPath]);

      if (removeError) {
        console.warn("Avatar Storage cleanup failed:", removeError);
      }
    }

    showProfileMessage("Profile picture removed.");
  } catch (error) {
    console.error("Avatar delete error:", error);

    showProfileMessage(
      error.message || "Could not remove profile picture.",
      true,
    );
  } finally {
    isAvatarProcessing = false;

    if (deleteProfilePicture) {
      deleteProfilePicture.disabled = false;
    }

    if (uploadProfilePicture) {
      uploadProfilePicture.disabled = false;
    }
  }
});

// =========================================
// INITIALIZE PROFILE PAGE
// =========================================

async function initializeProfilePage() {
  // Keep the entire page hidden until authentication
  // and profile loading are complete.
  profilePage?.classList.add("hidden");

  // Make profile fields read-only.
  makeProfileReadOnly();

  // Check the user's authentication.
  const user = await checkAuthentication();

  if (!user) {
    window.location.replace("/signin.html");
    return;
  }

  try {
    // Load the authenticated user's profile.
    await loadProfile(user);

    // Reveal the page only after successful loading.
    profilePage?.classList.remove("hidden");
  } catch (error) {
    console.error("Profile initialization error:", error);

    // Keep the page hidden if profile loading fails.
    profilePage?.classList.add("hidden");

    // If the profile cannot be loaded, show the login page.
    window.location.replace("/signin.html");
  }
}

document.addEventListener("DOMContentLoaded", initializeProfilePage);
