"use client";

import { createElement, forwardRef } from "react";

const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "transition",
  "exit",
  "variants",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "viewport",
  "layout",
  "layoutId",
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
]);

function nativeProps(props) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !MOTION_ONLY_PROPS.has(key)),
  );
}

function createMotionTag(tag) {
  const Component = forwardRef(function MotionLite({ children, ...props }, ref) {
    return createElement(tag, { ...nativeProps(props), ref }, children);
  });
  Component.displayName = `MotionLite(${tag})`;
  return Component;
}

export const m = {
  main: createMotionTag("main"),
  header: createMotionTag("header"),
  figure: createMotionTag("figure"),
  article: createMotionTag("article"),
};

export function LazyMotion({ children }) {
  return children;
}

export function MotionConfig({ children }) {
  return children;
}

export const domAnimation = {};
