"use client";

import { useState, useCallback, useId } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as S from "./styles";
import { useTranslations } from "@/lib/i18n/useTranslations";

const SUGGESTED_STAGES = [
  { name: "Initial Review", probability: 100, document_required: false, approval_required: false },
  { name: "Document Collection", probability: 80, document_required: true, approval_required: false },
  { name: "Validation & Verification", probability: 70, document_required: true, approval_required: true },
  { name: "Approval Workflow", probability: 60, document_required: false, approval_required: true },
  { name: "Execution", probability: 90, document_required: false, approval_required: false },
  { name: "Monitoring & Reporting", probability: 50, document_required: true, approval_required: false },
  { name: "Audit & Compliance Review", probability: 40, document_required: true, approval_required: true },
  { name: "Closure & Archival", probability: 30, document_required: true, approval_required: false },
];

interface Stage {
  id: string;
  name: string;
  probability: number;
  document_required: boolean;
  approval_required: boolean;
}

export interface StructureData {
  stages: Stage[];
  kpis: string[];
  compliance_checks: string[];
  audit_requirements: string[];
  deadlines: {
    has_statutory_deadline: boolean;
    fiscal_period: string;
  };
}

interface Props {
  value: string;
  onChange: (json: string) => void;
}

let nextId = 1;
function genId() {
  return `stage-${nextId++}`;
}

function parseStructure(json: string): StructureData {
  try {
    const obj = JSON.parse(json);
    return {
      stages: (obj.stages || []).map((s: any) => ({ id: genId(), ...s })),
      kpis: obj.kpis || [],
      compliance_checks: obj.compliance_checks || [],
      audit_requirements: obj.audit_requirements || [],
      deadlines: obj.deadlines || { has_statutory_deadline: false, fiscal_period: "monthly" },
    };
  } catch {
    return { stages: [], kpis: [], compliance_checks: [], audit_requirements: [], deadlines: { has_statutory_deadline: false, fiscal_period: "monthly" } };
  }
}

function serialize(data: StructureData): string {
  return JSON.stringify(
    {
      stages: data.stages.map(({ id: _, ...rest }) => rest),
      kpis: data.kpis,
      compliance_checks: data.compliance_checks,
      audit_requirements: data.audit_requirements,
      deadlines: data.deadlines,
    },
    null,
    2
  );
}

function SortableStage({ stage, onUpdate, onRemove }: { stage: Stage; onUpdate: (s: Stage) => void; onRemove: () => void }) {
  const { t } = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <S.StageCard ref={setNodeRef} style={style}>
      <S.StageHeader>
        <S.DragHandle {...attributes} {...listeners}>⠿</S.DragHandle>
        <S.StageInput
          value={stage.name}
          onChange={(e) => onUpdate({ ...stage, name: e.target.value })}
          placeholder={t("accounting.template.structure.stageNamePlaceholder")}
        />
        <S.RemoveButton onClick={onRemove}>✕</S.RemoveButton>
      </S.StageHeader>
      <S.StageBody>
        <S.ProbabilityRow>
          <S.ProbabilityLabel>{t("accounting.template.structure.probability", { value: stage.probability })}</S.ProbabilityLabel>
          <S.ProbabilitySlider
            type="range"
            min={0}
            max={100}
            value={stage.probability}
            onChange={(e) => onUpdate({ ...stage, probability: Number(e.target.value) })}
          />
        </S.ProbabilityRow>
        <S.ToggleRow>
          <S.ToggleLabel>
            <S.Checkbox
              type="checkbox"
              checked={stage.document_required}
              onChange={(e) => onUpdate({ ...stage, document_required: e.target.checked })}
            />
            {t("accounting.template.structure.documentRequired")}
          </S.ToggleLabel>
          <S.ToggleLabel>
            <S.Checkbox
              type="checkbox"
              checked={stage.approval_required}
              onChange={(e) => onUpdate({ ...stage, approval_required: e.target.checked })}
            />
            {t("accounting.template.structure.approvalRequired")}
          </S.ToggleLabel>
        </S.ToggleRow>
      </S.StageBody>
    </S.StageCard>
  );
}

export default function StructureBuilder({ value, onChange }: Props) {
  const { t } = useTranslations();
  const [data, setData] = useState<StructureData>(() => parseStructure(value));
  const [suggest, setSuggest] = useState("");
  const [newKpi, setNewKpi] = useState("");
  const [newCheck, setNewCheck] = useState("");
  const [newAudit, setNewAudit] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const emit = useCallback((d: StructureData) => {
    setData(d);
    onChange(serialize(d));
  }, [onChange]);

  function addSuggested(name: string) {
    const sug = SUGGESTED_STAGES.find((s) => s.name === name);
    if (!sug) return;
    const stage: Stage = { id: genId(), ...sug };
    emit({ ...data, stages: [...data.stages, stage] });
    setSuggest("");
  }

  function updateStage(stage: Stage) {
    emit({ ...data, stages: data.stages.map((s) => (s.id === stage.id ? stage : s)) });
  }

  function removeStage(id: string) {
    emit({ ...data, stages: data.stages.filter((s) => s.id !== id) });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.stages.findIndex((s) => s.id === active.id);
    const newIndex = data.stages.findIndex((s) => s.id === over.id);
    emit({ ...data, stages: arrayMove(data.stages, oldIndex, newIndex) });
  }

  function addKpi() {
    const v = newKpi.trim();
    if (!v) return;
    emit({ ...data, kpis: [...data.kpis, v] });
    setNewKpi("");
  }

  function removeKpi(i: number) {
    emit({ ...data, kpis: data.kpis.filter((_, idx) => idx !== i) });
  }

  function addCheck() {
    const v = newCheck.trim();
    if (!v) return;
    emit({ ...data, compliance_checks: [...data.compliance_checks, v] });
    setNewCheck("");
  }

  function removeCheck(i: number) {
    emit({ ...data, compliance_checks: data.compliance_checks.filter((_, idx) => idx !== i) });
  }

  function addAudit() {
    const v = newAudit.trim();
    if (!v) return;
    emit({ ...data, audit_requirements: [...data.audit_requirements, v] });
    setNewAudit("");
  }

  function removeAudit(i: number) {
    emit({ ...data, audit_requirements: data.audit_requirements.filter((_, idx) => idx !== i) });
  }

  const stageIds = data.stages.map((s) => s.id);

  return (
    <S.BuilderContainer>
      <S.Section>
        <S.SectionTitle>{t("accounting.template.structure.stages")} <S.Required>*</S.Required></S.SectionTitle>

        <S.SuggestRow>
          <S.Select value={suggest} onChange={(e) => setSuggest(e.target.value)}>
            <option value="">{t("accounting.template.structure.suggestPlaceholder")}</option>
            {SUGGESTED_STAGES.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </S.Select>
          {suggest && (
            <S.SmallButton type="button" onClick={() => addSuggested(suggest)}>{t("accounting.template.structure.suggestAdd")}</S.SmallButton>
          )}
          <S.SmallButton type="button" onClick={() => {
            const stage = { id: genId(), name: "", probability: 50, document_required: false, approval_required: false };
            emit({ ...data, stages: [...data.stages, stage] });
          }}>{t("accounting.template.structure.addCustom")}</S.SmallButton>
        </S.SuggestRow>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stageIds} strategy={verticalListSortingStrategy}>
            {data.stages.length === 0 && <S.EmptyHint>{t("accounting.template.structure.emptyStages")}</S.EmptyHint>}
            {data.stages.map((stage) => (
              <SortableStage
                key={stage.id}
                stage={stage}
                onUpdate={updateStage}
                onRemove={() => removeStage(stage.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </S.Section>

      <S.Section>
        <S.SectionTitle>{t("accounting.template.structure.kpis")}</S.SectionTitle>
        <S.TagInputRow>
          <S.TagInput
            value={newKpi}
            onChange={(e) => setNewKpi(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKpi(); } }}
            placeholder={t("accounting.template.structure.kpisPlaceholder")}
          />
          <S.SmallButton type="button" onClick={addKpi}>{t("accounting.template.structure.suggestAdd")}</S.SmallButton>
        </S.TagInputRow>
        <S.TagList>
          {data.kpis.map((kpi, i) => (
            <S.Tag key={i}>
              {kpi}
              <S.TagRemove onClick={() => removeKpi(i)}>✕</S.TagRemove>
            </S.Tag>
          ))}
        </S.TagList>
      </S.Section>

      <S.Section>
        <S.SectionTitle>{t("accounting.template.structure.complianceChecks")}</S.SectionTitle>
        <S.TagInputRow>
          <S.TagInput
            value={newCheck}
            onChange={(e) => setNewCheck(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCheck(); } }}
            placeholder={t("accounting.template.structure.compliancePlaceholder")}
          />
          <S.SmallButton type="button" onClick={addCheck}>{t("accounting.template.structure.suggestAdd")}</S.SmallButton>
        </S.TagInputRow>
        <S.TagList>
          {data.compliance_checks.map((c, i) => (
            <S.Tag key={i}>
              {c}
              <S.TagRemove onClick={() => removeCheck(i)}>✕</S.TagRemove>
            </S.Tag>
          ))}
        </S.TagList>
      </S.Section>

      <S.Section>
        <S.SectionTitle>{t("accounting.template.structure.auditRequirements")}</S.SectionTitle>
        <S.TagInputRow>
          <S.TagInput
            value={newAudit}
            onChange={(e) => setNewAudit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAudit(); } }}
            placeholder={t("accounting.template.structure.auditPlaceholder")}
          />
          <S.SmallButton type="button" onClick={addAudit}>{t("accounting.template.structure.suggestAdd")}</S.SmallButton>
        </S.TagInputRow>
        <S.TagList>
          {data.audit_requirements.map((a, i) => (
            <S.Tag key={i}>
              {a}
              <S.TagRemove onClick={() => removeAudit(i)}>✕</S.TagRemove>
            </S.Tag>
          ))}
        </S.TagList>
      </S.Section>

      <S.Section>
        <S.SectionTitle>{t("accounting.template.structure.deadlines")}</S.SectionTitle>
        <S.DeadlineRow>
          <S.ToggleLabel>
            <S.Checkbox
              type="checkbox"
              checked={data.deadlines.has_statutory_deadline}
              onChange={(e) => emit({ ...data, deadlines: { ...data.deadlines, has_statutory_deadline: e.target.checked } })}
            />
            {t("accounting.template.structure.hasStatutoryDeadline")}
          </S.ToggleLabel>
          <S.DeadlineSelect
            value={data.deadlines.fiscal_period}
            onChange={(e) => emit({ ...data, deadlines: { ...data.deadlines, fiscal_period: e.target.value } })}
          >
            <option value="monthly">{t("accounting.template.structure.fiscalPeriods.monthly")}</option>
            <option value="quarterly">{t("accounting.template.structure.fiscalPeriods.quarterly")}</option>
            <option value="semester">{t("accounting.template.structure.fiscalPeriods.semester")}</option>
            <option value="annual">{t("accounting.template.structure.fiscalPeriods.annual")}</option>
            <option value="custom">{t("accounting.template.structure.fiscalPeriods.custom")}</option>
          </S.DeadlineSelect>
        </S.DeadlineRow>
      </S.Section>
    </S.BuilderContainer>
  );
}
