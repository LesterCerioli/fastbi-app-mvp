export interface Role {
  id: string;
  labelKey: string;
}

export const roles: Role[] = [
  { id: "admin", labelKey: "profileEditor.roles.admin" },
  { id: "manager", labelKey: "profileEditor.roles.manager" },
  { id: "analyst", labelKey: "profileEditor.roles.analyst" },
  { id: "viewer", labelKey: "profileEditor.roles.viewer" },
];

export function getRoleLabelKey(roleId: string): string {
  const role = roles.find((r) => r.id === roleId);
  return role?.labelKey || "profileEditor.roles.viewer";
}
