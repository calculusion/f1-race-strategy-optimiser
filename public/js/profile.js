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
// GET USER NAME
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
// SET FIELD VALUE
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
  setFieldValue("fullName", getAuthName(user));
  setFieldValue("primaryEmail", user.email || "");

  setFieldValue("preferredName", profile.preferred_name);
  setFieldValue("username", profile.username);
  setFieldValue("role", profile.role);
  setFieldValue("website", profile.website);
  setFieldValue("bio", profile.bio);

  setFieldValue("language", profile.language);
  setFieldValue("landingView", profile.landing_view);
  setFieldValue("digestCadence", profile.digest_cadence);

  updateAvatarDisplay(user, profile);
}

// =========================================
// DISPLAY PROFILE IMAGE
// =========================================

function updateAvatarDisplay(user, profile) {
  if (!profileAvatar) return;

  if (profile.avatar_removed) {
    profileAvatar.src = DEFAULT_AVATAR;
    return;
  }

  if (profile.avatar_path) {
    const { data } = supabaseClient.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(profile.avatar_path);

    profileAvatar.src = data.publicUrl;
  } else {
    profileAvatar.src = getProviderAvatar(user) || DEFAULT_AVATAR;
  }

  profileAvatar.onerror = () => {
    profileAvatar.onerror = null;
    profileAvatar.src = DEFAULT_AVATAR;
  };
}

// =========================================
// LOAD PROFILE
// =========================================

async function loadProfile() {
  try {
    const user = await checkAuthentication();

    if (!user) return;

    currentUser = user;

    const { data: profile, error: profileError } = await supabaseClient
      .from(PROFILE_TABLE)
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

    // Keep authentication-managed fields read-only.
    ["fullName", "primaryEmail"].forEach((id) => {
      const field = document.getElementById(id);

      if (field) {
        field.readOnly = true;
        field.setAttribute("aria-readonly", "true");
        field.classList.add("cursor-default");
      }
    });

    // Display the profile after loading.
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
    const { error: uploadError } = await supabaseClient.storage
      .from(AVATAR_BUCKET)
      .upload(newPath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabaseClient
      .from(PROFILE_TABLE)
      .update({
        avatar_path: newPath,
        avatar_removed: false,
      })
      .eq("id", currentUser.id);

    if (updateError) {
      await supabaseClient.storage.from(AVATAR_BUCKET).remove([newPath]);

      throw updateError;
    }

    currentProfile.avatar_path = newPath;
    currentProfile.avatar_removed = false;

    updateAvatarDisplay(currentUser, currentProfile);

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
    const { error: updateError } = await supabaseClient
      .from(PROFILE_TABLE)
      .update({
        avatar_path: null,
        avatar_removed: true,
      })
      .eq("id", currentUser.id);

    if (updateError) throw updateError;

    currentProfile.avatar_path = null;
    currentProfile.avatar_removed = true;

    updateAvatarDisplay(currentUser, currentProfile);

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
// SAVE PROFILE
// =========================================

document
  .getElementById("saveProfileButton")
  ?.addEventListener("click", async () => {
    if (!currentUser || !currentProfile) {
      showProfileMessage("Profile is not ready yet. Please try again.", true);
      return;
    }

    const saveButton = document.getElementById("saveProfileButton");
    const cancelButton = document.getElementById("cancelProfileButton");

    if (!saveButton) return;

    const getValue = (id) => {
      const element = document.getElementById(id);
      return element ? element.value.trim() : "";
    };

    const getSelectValue = (id) => {
      const element = document.getElementById(id);
      return element ? element.value : "";
    };

    const updates = {
      preferred_name: getValue("preferredName") || null,
      username: getValue("username") || null,
      role: getValue("role") || null,
      website: getValue("website") || null,
      bio: getValue("bio") || null,
      language: getSelectValue("language") || null,
      landing_view: getSelectValue("landingView") || null,
      digest_cadence: getSelectValue("digestCadence") || null,
    };

    saveButton.disabled = true;

    if (cancelButton) {
      cancelButton.disabled = true;
    }

    saveButton.textContent = "Saving...";

    try {
      const { data, error } = await supabaseClient
        .from(PROFILE_TABLE)
        .update(updates)
        .eq("id", currentUser.id)
        .select()
        .single();

      if (error) throw error;

      currentProfile = data;

      showProfileMessage("Profile updated successfully.");
    } catch (error) {
      console.error("Profile save error:", error);

      showProfileMessage(error.message || "Unable to save profile.", true);
    } finally {
      saveButton.disabled = false;

      if (cancelButton) {
        cancelButton.disabled = false;
      }

      saveButton.textContent = "Save changes";
    }
  });

// =========================================
// CANCEL PROFILE CHANGES
// =========================================

document
  .getElementById("cancelProfileButton")
  ?.addEventListener("click", () => {
    if (!currentUser || !currentProfile) return;

    populateProfile(currentUser, currentProfile);
    showProfileMessage("Changes discarded.");
  });

// =========================================
// INITIALIZE PROFILE PAGE
// =========================================

loadProfile();
