"use client";

import { useState } from "react";
import type { Capability } from "@/lib/types";

export const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  capabilities: Capability[];
  locked: boolean;
  onUpdate: (id: string, activity: string, detail: string) => void;
  onRemove: (id: string) => void;
  onAdd: (activity: string, detail: string) => void;
};

function Editor({
  initialActivity,
  initialDetail,
  submitLabel,
  onSave,
  onCancel,
}: {
  initialActivity: string;
  initialDetail: string;
  submitLabel: string;
  onSave: (activity: string, detail: string) => void;
  onCancel: () => void;
}) {
  const [activity, setActivity] = useState(initialActivity);
  const [detail, setDetail] = useState(initialDetail);
  return (
    <form
      className="stack gap-12"
      onSubmit={(e) => {
        e.preventDefault();
        if (activity.trim()) onSave(activity.trim(), detail.trim());
      }}
    >
      <label className="stack gap-8">
        <span className="small-label">What you actually do</span>
        <textarea className="textarea" rows={2} value={activity} onChange={(e) => setActivity(e.target.value)} autoFocus />
      </label>
      <label className="stack gap-8">
        <span className="small-label">What it looks like in practice (optional)</span>
        <input className="input" value={detail} onChange={(e) => setDetail(e.target.value)} />
      </label>
      <div className="actions">
        <button className="button" type="submit" disabled={!activity.trim()}>
          {submitLabel}
        </button>
        <button className="text-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Capabilities({ capabilities, locked, onUpdate, onRemove, onAdd }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="stack gap-32">
      <ol className="caps">
        {capabilities.map((c, i) => (
          <li className="cap" key={c.id}>
            <span className="num">{pad(i + 1)}</span>
            {editing === c.id ? (
              <Editor
                initialActivity={c.activity}
                initialDetail={c.detail}
                submitLabel="Save"
                onSave={(a, d) => {
                  onUpdate(c.id, a, d);
                  setEditing(null);
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="stack gap-8">
                <p className="cap-activity">{c.activity}</p>
                {c.detail && <p className="cap-detail">{c.detail}</p>}
                {!locked && (
                  <div className="cap-tools">
                    <button className="text-button" type="button" onClick={() => setEditing(c.id)}>
                      Edit
                    </button>
                    {capabilities.length > 1 && (
                      <button className="text-button" type="button" onClick={() => onRemove(c.id)}>
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
      {!locked &&
        capabilities.length < 8 &&
        (adding ? (
          <div className="cap">
            <span className="num">{pad(capabilities.length + 1)}</span>
            <Editor
              initialActivity=""
              initialDetail=""
              submitLabel="Add"
              onSave={(a, d) => {
                onAdd(a, d);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <div>
            <button className="text-button" type="button" onClick={() => setAdding(true)}>
              Add something you do that's missing
            </button>
          </div>
        ))}
    </div>
  );
}
