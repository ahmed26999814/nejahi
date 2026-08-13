"use client";

import { Children, isValidElement } from "react";

function mark(component, role) {
  component.__selectLiteRole = role;
  return component;
}

function collectByRole(children, role, matches = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type?.__selectLiteRole === role) matches.push(child);
    if (child.props?.children) collectByRole(child.props.children, role, matches);
  });
  return matches;
}

function firstByRole(children, role) {
  return collectByRole(children, role, [])[0] || null;
}

function textFromNode(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement(node)) return textFromNode(node.props?.children);
  return "";
}

export function Root({ children, disabled = false, onValueChange, value, name, required }) {
  const trigger = firstByRole(children, "trigger");
  const valueNode = trigger ? firstByRole(trigger.props.children, "value") : null;
  const iconNode = trigger ? firstByRole(trigger.props.children, "icon") : null;
  const items = collectByRole(children, "item");
  const placeholder = valueNode?.props?.placeholder || trigger?.props?.["aria-label"] || "اختر";
  const triggerClassName = trigger?.props?.className || "search-input";
  const ariaLabel = trigger?.props?.["aria-label"] || placeholder;
  const selectedValue = value == null ? "" : String(value);

  return (
    <span className="relative block w-full">
      <select
        aria-label={ariaLabel}
        className={`${triggerClassName} w-full appearance-none`}
        disabled={disabled}
        name={name}
        onChange={(event) => onValueChange?.(event.target.value)}
        required={required}
        value={selectedValue}
      >
        <option value="" disabled>{placeholder}</option>
        {items.map((item, index) => {
          const itemText = firstByRole(item.props.children, "item-text");
          const label = textFromNode(itemText?.props?.children || item.props.children) || String(item.props.value || "");
          return (
            <option disabled={item.props.disabled} key={`${item.props.value}-${index}`} value={String(item.props.value)}>
              {label}
            </option>
          );
        })}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center text-mauri-green" aria-hidden="true">
        {iconNode?.props?.children || "⌄"}
      </span>
    </span>
  );
}

export const Trigger = mark(function Trigger() { return null; }, "trigger");
export const Value = mark(function Value() { return null; }, "value");
export const Icon = mark(function Icon() { return null; }, "icon");
export const Portal = mark(function Portal() { return null; }, "portal");
export const Content = mark(function Content() { return null; }, "content");
export const Viewport = mark(function Viewport() { return null; }, "viewport");
export const Item = mark(function Item() { return null; }, "item");
export const ItemText = mark(function ItemText() { return null; }, "item-text");
