import React, { useState } from "react";
import { FolderGit2, Plus } from "lucide-react";
import type { GitHubRepo } from "../../@types/api";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/useToast";
import { usePreferences } from "../../lib/usePreferences";

export interface NewProjectValues {
  name: string;
  description: string;
  repository: string;
}

export interface CreateProjectModalProps {
  open: boolean;
  repos: GitHubRepo[];
  creating: boolean;
  onClose: () => void;
  /** Retourne `true` si le projet a été créé (le formulaire est alors vidé). */
  onSubmit: (values: NewProjectValues) => Promise<boolean>;
}

/** Modale de création de projet ; les champs sont réinitialisés à la fermeture. */
export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  repos,
  creating,
  onClose,
  onSubmit,
}) => {
  const { t } = usePreferences();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repository, setRepository] = useState("");

  const close = () => {
    setName("");
    setDescription("");
    setRepository("");
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !repository) {
      toast.error(t("Missing info"), t("Add a project name and pick a GitHub repo."));
      return;
    }
    const created = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      repository,
    });
    if (created) {
      setName("");
      setDescription("");
      setRepository("");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t("New project")}
      description={t("Connect a GitHub repository to configure an automated workflow.")}
      icon={
        <div className="rounded-md bg-accent/15 p-2 text-accent-ink">
          <FolderGit2 className="h-5 w-5" />
        </div>
      }
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close}>
            {t("Cancel")}
          </Button>
          <Button size="sm" form="create-project-form" type="submit" loading={creating}>
            {creating ? (
              t("Creating...")
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> {t("Initialize")}
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="create-project-form" onSubmit={submit} className="space-y-4">
        <Field label={`${t("Project name")} *`}>
          {(id) => (
            <Input
              id={id}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("e.g. Production API")}
              required
            />
          )}
        </Field>

        <Field label={`${t("GitHub repository")} *`}>
          {(id) => (
            <Select
              id={id}
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              className="font-mono"
            >
              <option value="">
                {repos.length === 0
                  ? `-- ${t("No repositories available")} --`
                  : `-- ${t("Select a GitHub repository")} --`}
              </option>
              {repos.map((repo) => (
                <option key={repo.id} value={repo.full_name}>
                  {repo.full_name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label={t("Description")}>
          {(id) => (
            <Textarea
              id={id}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              placeholder={t("Optional project details...")}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
};
