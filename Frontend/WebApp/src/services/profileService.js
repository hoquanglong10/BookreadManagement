import { changePasswordRequest, updateProfileRequest } from "../api/authApi.js";

export const updateProfile = profile => updateProfileRequest({
  displayName: profile.displayName.trim(),
  avatarUrl: profile.avatarUrl.trim() || null
});

export const changePassword = passwords => changePasswordRequest(passwords);
