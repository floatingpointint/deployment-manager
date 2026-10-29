import type { IconSvgProps } from "@/types/misc";

// https://www.svgrepo.com/svg/471469/git-commit

export default function CommitIcon({ size = 24, ...props }: IconSvgProps) {
  return (
    <svg
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16 12C16 14.2091 14.2092 16 12 16C9.79091 16 8.00005 14.2091 8.00005 12M16 12C16 9.79086 14.2092 8 12 8C9.79091 8 8.00005 9.79086 8.00005 12M16 12H22M8.00005 12H2.00024"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
