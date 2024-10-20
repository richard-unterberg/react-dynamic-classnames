import clsx from 'clsx'
import {
  createElement,
  CSSProperties,
  forwardRef,
  ForwardRefExoticComponent,
  JSX,
  RefAttributes,
  useMemo,
} from 'react'

export type RefComponent<T> = ForwardRefExoticComponent<T & RefAttributes<HTMLElement>>
export type ComponentOptions<T> = {
  /** Base CSS class for the component */
  base?: string
  /** Function to dynamically generate an array of classes based on props */
  classes?: (props: T) => string[]
  /** Static or dynamic CSS object applied to the component */
  css?: CSSProperties | ((props: T) => CSSProperties)
}

export type HTMLProps<T, K extends keyof JSX.IntrinsicElements> = T & JSX.IntrinsicElements[K]
export type ValidProps<T, K extends keyof JSX.IntrinsicElements> = T & JSX.IntrinsicElements[K]

// core type
export type DsComponent = {
  [K in keyof JSX.IntrinsicElements]: <T, E extends keyof JSX.IntrinsicElements = K>(
    options?: ComponentOptions<T> | string | ((props: HTMLProps<T, E>) => string),
    css?: ((props: HTMLProps<T, E>) => CSSProperties) | CSSProperties,
  ) => RefComponent<ValidProps<T, E>>
}

/**
 * Cleans and trims any extra spaces in the className string.
 *
 * @param className - The className string to clean.
 * @returns A trimmed className string.
 */
export const cleanClassName = (className: string) => className.replace(/\s+/g, ' ').trim()

/**
 * Omits custom props (those starting with '$') from the props passed to the DOM element.
 *
 * @param props - The full set of props passed to the component.
 * @param customProps - An array of custom prop keys to omit.
 * @returns The filtered props object to be passed to the DOM element.
 */
export const omitCustomProps = <T extends object, K extends keyof JSX.IntrinsicElements>(
  props: T,
  customProps: (keyof T)[],
): JSX.IntrinsicElements[K] => {
  const domProps: Record<string, any> = {}
  for (const key in props) {
    if (!customProps.includes(key as keyof T)) {
      domProps[key] = props[key]
    }
  }
  return domProps as JSX.IntrinsicElements[K]
}

/**
 * Creates a custom component with dynamic class names and styles based on passed props.
 *
 * @param tag - The HTML tag or React element to render.
 * @param options - Configuration object for base classes, dynamic classes, and styles.
 * @param css - Static or dynamic CSS styles to apply to the component.
 * @returns A forwardRef React component that dynamically renders with calculated props, classes, and styles.
 */
export const createComponent = <
  T extends object,
  K extends keyof JSX.IntrinsicElements = keyof JSX.IntrinsicElements,
>(
  tag: K,
  options?: ComponentOptions<T> | string | ((props: HTMLProps<T, K>) => string),
  css?: ((props: HTMLProps<T, K>) => CSSProperties) | CSSProperties,
): RefComponent<ValidProps<T, K>> => {
  const RenderComponent = forwardRef<HTMLElement, ValidProps<T, K>>((props, ref) => {
    const { className, style, ...restProps } = props

    // Resolve base class string
    const baseClass = useMemo(() => {
      if (typeof options === 'string') return options
      if (typeof options === 'object') return options.base
      return undefined
    }, [options])

    // Resolve dynamic classes based on props
    const dynamicClasses = useMemo(() => {
      if (typeof options === 'object') return options?.classes
      if (typeof options === 'function') return options
      return undefined
    }, [options])

    // Resolve dynamic CSS based on props
    const dynamicCss = useMemo(() => {
      if (typeof options === 'object') return options?.css
      return css
    }, [options, css])

    // generate className string
    const classes = useMemo(
      () =>
        cleanClassName(
          clsx(
            baseClass,
            dynamicClasses ? dynamicClasses(props as HTMLProps<T, K>) : [],
            className,
          ),
        ),
      [baseClass, dynamicClasses, className, props],
    )

    // resolve CSS object
    const resolvedCss = useMemo(
      () => (typeof dynamicCss === 'function' ? dynamicCss(props as HTMLProps<T, K>) : dynamicCss),
      [dynamicCss, props],
    )

    // merge custom and passed styles
    const mergedStyles = useMemo(() => ({ ...resolvedCss, ...style }), [resolvedCss, style])

    // collect custom props starting with '$'
    const customProps = useMemo(
      () =>
        (Object.keys(props) as (keyof T)[]).filter(
          key => typeof key === 'string' && key.startsWith('$'),
        ),
      [props],
    )

    // filter out custom props before passing to the DOM element
    const domProps = useMemo(
      () => omitCustomProps<T, K>(restProps as T, customProps),
      [restProps, customProps],
    )

    // Render the element with the calculated props, classes, and styles
    return createElement(tag, {
      ...domProps,
      className: classes,
      style: mergedStyles,
      ref,
    })
  })

  RenderComponent.displayName = `DynamicComponent(${tag})`

  return RenderComponent as RefComponent<ValidProps<T, K>>
}

// Create the proxy with correct typings for the intrinsic elements
export const dsProxy = new Proxy(
  {},
  {
    get:
      (_, tag: keyof JSX.IntrinsicElements) =>
      <T extends object, K extends keyof JSX.IntrinsicElements = typeof tag>(
        options?: ComponentOptions<T> | string | ((props: HTMLProps<T, K>) => string),
        css?: ((props: HTMLProps<T, K>) => CSSProperties) | CSSProperties,
      ) =>
        createComponent<T, K>(tag as K, options, css),
  },
) as DsComponent

/**
 * A utility that creates classname strings and dynamic styles for React components.
 * @example
 * ```tsx
 * const SomeButton = ds.div<{ $isActive?: boolean; $isLoading?: boolean }>(
 *  ({ $isActive }) => `
 *    absolute
 *    z-10
 *    transition-all
 *    ${$isActive ? 'bg-blue-400 text-white' : 'bg-blue-400 text-blue-200'}
 *    `,
 * )
 * ```
 */
export const ds = dsProxy
