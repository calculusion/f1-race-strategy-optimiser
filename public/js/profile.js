// =========================================
// PROFILE PAGE
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

const profileAvatar = document.getElementById("profileAvatar");

const profilePictureInput = document.getElementById("profilePictureInput");

const uploadProfilePicture = document.getElementById("uploadProfilePicture");

const deleteProfilePicture = document.getElementById("deleteProfilePicture");

// =========================================
// AUTHENTICATION CHECK
// =========================================

async function checkAuthentication() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    window.location.replace("/signin.html");
    return null;
  }

  return user;
}

// =========================================
// PROFILE IMAGE STATUS MESSAGE
// =========================================

function showProfileMessage(message, isError = false) {
  let messageElement = document.getElementById("profileImageMessage");

  if (!messageElement) {
    messageElement = document.createElement("p");
    messageElement.id = "profileImageMessage";
    messageElement.className = "mt-2 text-[11px]";
    messageElement.setAttribute("aria-live", "polite");

    // Place the message below the image buttons.
    const buttonContainer = uploadProfilePicture?.parentElement;

    if (buttonContainer) {
      buttonContainer.appendChild(messageElement);
    } else {
      return;
    }
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

    // Text, email, and other input fields
    card
      .querySelectorAll(
        "input:not([type='file']):not([type='checkbox']), textarea",
      )
      .forEach((field) => {
        field.readOnly = true;
        field.setAttribute("aria-readonly", "true");
        field.classList.add("cursor-default");
      });

    // Dropdown fields, if any
    card.querySelectorAll("select").forEach((field) => {
      field.disabled = true;
      field.classList.add("cursor-not-allowed", "opacity-100");
    });

    // Checkbox fields, if any
    card.querySelectorAll("input[type='checkbox']").forEach((field) => {
      field.disabled = true;
    });
  });

  // Hide Save and Cancel buttons, if present.
  document.getElementById("profileActionButtons")?.classList.add("hidden");
}

// =========================================
// GET USER NAME FROM SUPABASE AUTH
// =========================================

function getAuthName(user) {
  const metadata = user.user_metadata || {};

  return metadata.full_name || metadata.name || metadata.user_name || "";
}

// =========================================
// GET GOOGLE / GITHUB PROFILE IMAGE
// =========================================

function getProviderAvatar(user) {
  const metadata = user.user_metadata || {};

  return metadata.avatar_url || metadata.picture || metadata.avatar || null;
}

// =========================================
// SET HTML FIELD VALUE
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
// POPULATE PROFILE FIELDS
// =========================================

function populateProfile(user, profile) {
  const authName = getAuthName(user);

  // Supabase Auth fields
  setFieldValue("fullName", authName);
  setFieldValue("primaryEmail", user.email || "");

  // Custom profile fields
  setFieldValue("preferredName", profile.preferred_name);
  setFieldValue("username", profile.username);
  setFieldValue("role", profile.role);
  setFieldValue("website", profile.website);
  setFieldValue("bio", profile.bio);

  // Profile preferences
  setFieldValue("language", profile.language);
  setFieldValue("landingView", profile.landing_view);
  setFieldValue("digestCadence", profile.digest_cadence);

  // Profile picture
  updateAvatarDisplay(user, profile);
}

// =========================================
// DISPLAY PROFILE IMAGE
// =========================================

function updateAvatarDisplay(user, profile) {
  if (!profileAvatar) return;

  // User explicitly removed their image.
  if (profile.avatar_removed) {
    profileAvatar.src = DEFAULT_AVATAR;
    return;
  }

  // Custom uploaded image takes priority.
  if (profile.avatar_path) {
    const { data } = supabaseClient.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(profile.avatar_path);

    profileAvatar.src = data.publicUrl;
  } else {
    // Otherwise, use the Google or GitHub avatar.
    profileAvatar.src = getProviderAvatar(user) || DEFAULT_AVATAR;
  }

  // Fall back to the default image if loading fails.
  profileAvatar.onerror = () => {
    profileAvatar.onerror = null;
    profileAvatar.src = DEFAULT_AVATAR;
  };
}

// =========================================
// LOAD PROFILE
// =========================================

// =========================================
// LOAD PROFILE
// =========================================

async function loadProfile() {
  makeProfileReadOnly();

  try {
    // Verify the signed-in user
    const user = await checkAuthentication();

    if (!user) return;

    currentUser = user;

    // Fetch only this user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile load error:", profileError);
      showProfileMessage("Unable to load profile.", true);
      return;
    }

    if (!profile) {
      showProfileMessage("Profile not found.", true);
      return;
    }

    currentProfile = profile;

    populateProfile(user, profile);

    // Show the profile only after authentication
    // and profile data have been verified.
    document.getElementById("profilePage")?.classList.remove("hidden");
  } catch (error) {
    console.error("Profile error:", error);
    showProfileMessage("Something went wrong.", true);
  }
}

// =========================================
// OPEN IMAGE FILE PICKER
// =========================================

uploadProfilePicture?.addEventListener("click", () => {
  if (isAvatarProcessing) return;

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

  // Validate file size: 5 MB maximum.
  if (file.size > 5 * 1024 * 1024) {
    showProfileMessage("Image must be smaller than 5 MB.", true);

    event.target.value = "";
    return;
  }

  isAvatarProcessing = true;
  uploadProfilePicture.disabled = true;

  if (deleteProfilePicture) {
    deleteProfilePicture.disabled = true;
  }

  showProfileMessage("Uploading profile picture...");

  const extension = file.type === "image/png" ? "png" : "jpg";

  const newPath = `${currentUser.id}/${crypto.randomUUID()}.${extension}`;

  const oldPath = currentProfile.avatar_path;

  try {
    // Upload image to Supabase Storage.
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

    // Save the new image path in the profile table.
    const { error: updateError } = await supabaseClient
      .from(PROFILE_TABLE)
      .update({
        avatar_path: newPath,
        avatar_removed: false,
      })
      .eq("id", currentUser.id);

    if (updateError) {
      // Remove the new upload if saving the path fails.
      await supabaseClient.storage.from(AVATAR_BUCKET).remove([newPath]);

      throw updateError;
    }

    // Update local profile data.
    currentProfile.avatar_path = newPath;
    currentProfile.avatar_removed = false;

    // Display the new image immediately.
    updateAvatarDisplay(currentUser, currentProfile);

    // Remove the old custom image after the new one is saved.
    if (oldPath) {
      const { error: removeError } = await supabaseClient.storage
        .from(AVATAR_BUCKET)
        .remove([oldPath]);

      if (removeError) {
        console.warn("Old profile image could not be removed:", removeError);
      }
    }

    showProfileMessage("Profile picture updated.");
  } catch (error) {
    console.error("Avatar upload error:", error);

    showProfileMessage(error.message || "Image upload failed.", true);
  } finally {
    isAvatarProcessing = false;
    uploadProfilePicture.disabled = false;

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
  deleteProfilePicture.disabled = true;
  uploadProfilePicture.disabled = true;

  showProfileMessage("Removing profile picture...");

  const oldPath = currentProfile.avatar_path;

  try {
    // Mark the avatar as removed in the database.
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

    // Update local profile data.
    currentProfile.avatar_path = null;
    currentProfile.avatar_removed = true;

    // Show the default image instead of the provider image.
    updateAvatarDisplay(currentUser, currentProfile);

    // Remove the old custom image from Storage.
    if (oldPath) {
      const { error: removeError } = await supabaseClient.storage
        .from(AVATAR_BUCKET)
        .remove([oldPath]);

      if (removeError) {
        console.warn("Profile image Storage cleanup failed:", removeError);
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
    deleteProfilePicture.disabled = false;
    uploadProfilePicture.disabled = false;
  }
});

// =========================================
// INITIALIZE PROFILE PAGE
// =========================================

loadProfile();
