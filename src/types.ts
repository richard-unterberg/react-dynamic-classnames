import {
  ForwardRefExoticComponent,
  JSXElementConstructor,
  PropsWithoutRef,
  RefAttributes,
} from "react";

/**
 * Validates the additional props `T` against the intrinsic element type `E`.
 *
 * @typeParam E - The intrinsic element type (e.g., 'div', 'button').
 * @typeParam T - The additional props to validate.
 */
type Validator<E extends keyof JsxElements, T extends object> = T &
  JsxElements[E];

/**
 * interpolation type for "styled components".
 *
 * Interpolations can be:
 * - Static strings or booleans.
 * - Functions that take the component's props and return a class name string.
 * - Null or undefined values (ignored in class name computation).
 *
 * @typeParam T - The type of the props passed to the interpolation function.
 */
export type Interpolation<T> = string | boolean | ((props: T) => string) | null | undefined;

/**
 * Extends a styled component or intrinsic element with additional props and interpolations.
 *
 * This type defines the `extend` method used in the library.
 */
export type ExtendFunction = {
  /**
   * The `extend` method allows you to create a new styled component from an existing one.
   *
   * @typeParam E - The type of the original component, which can be a ForwardRefExoticComponent or a JSXElementConstructor.
   * @param component - The base component to extend.
   * @returns A function that accepts template strings and interpolations, and returns a new styled component.
   * @example
   * ```tsx
   * // Extending a custom component without intrinsic element type
   * const SomeBase = rsc.div<{ $active?: boolean }>`color: red;`
   * const Extended = rsc.extend(SomeBase)<{ $highlighted?: boolean }>`
   *   ${p => p.$highlighted ? 'bg-yellow' : ''}
   *   ${p => p.$active ? 'text-red' : ''}
   * `
   *
   * // extending with specific props:
   * const ExtendedButton = rsc.extend(StyledButton)<ButtonHTMLAttributes<HTMLButtonElement>>`
   *   ${p => p.type === 'submit' ? 'font-bold' : ''}
   * `
   * ```
   */
  <E extends ForwardRefExoticComponent<any> | JSXElementConstructor<any>>(
    component: E
  ): <T extends object>(
    strings: TemplateStringsArray,
    ...interpolations: Interpolation<MergeProps<E, T>>[]
  ) => BaseComponent<MergeProps<E, T>>;
  <E extends ForwardRefExoticComponent<any> | JSXElementConstructor<any>, I extends keyof JsxElements>(
    component: E,
  ): <T extends object>(
    strings: TemplateStringsArray,
    ...interpolations: Array<Interpolation<Validator<I, T> & JsxElements[I]>>
  ) => BaseComponent<Validator<I, T> & JsxElements[I]>;
};

export type VariantsConfig<Props extends object> = {
  base?: string;
  variants: {
    [Key in keyof Props]?: Record<
      string,
      string | ((props: Props) => string)
    >;
  } & {
    [key: string]: Record<string, string | ((props: Props) => string)>;
  };
};

type VariantsFunction = {
  <Props extends object>(
    config: VariantsConfig<Props>
  ): BaseComponent<Props>;
};

/**
 * The main factory object for creating styled components.
 *
 * Includes:
 * - Functions for each intrinsic HTML element (e.g., `rsc.div`, `rsc.span`, etc.).
 * - An `extend` method for extending components.
 */
export type RscComponentFactory = {
  [K in keyof JsxElements]: {
    <T>(
      strings: TemplateStringsArray,
      ...interpolations: Interpolation<T>[]
    ): BaseComponent<MergeProps<K, T>>;
    variants: VariantsFunction;
  };
} & {
  extend: ExtendFunction;
};

/** Alias => Intrinsic react elements */
export type JsxElements = React.JSX.IntrinsicElements

/**
 * Extracts the inner props of a component.
 *
 * If `P` is a component with `PropsWithoutRef` and `RefAttributes`, the props are extracted.
 * Otherwise, `P` is returned as is.
 *
 * @typeParam P - The type of the component to extract props from.
 */
export type InnerProps<P> = P extends PropsWithoutRef<infer U> & RefAttributes<unknown> ? U : P;

/**
 * Merges additional props with the base props of a given component or intrinsic element.
 *
 * @typeParam E - The base component type or intrinsic element.
 * @typeParam T - Additional props to merge with the base props.
 */
export type MergeProps<E, T> = E extends keyof JsxElements
  ? JsxElements[E] & T
  : E extends ForwardRefExoticComponent<infer P>
  ? InnerProps<P> & T
  : E extends JSXElementConstructor<infer P2>
  ? P2 & T
  : T;

/**
 * Base type for styled React components with forward refs.
 *
 * @typeParam P - Props of the component.
 */
export type BaseComponent<P> = ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<HTMLElement>
>;

export type Rsc = Partial<RscComponentFactory>