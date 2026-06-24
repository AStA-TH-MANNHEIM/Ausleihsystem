import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

const Sub = DropdownMenuPrimitive.Sub;
const Root = DropdownMenuPrimitive.Root;
const Trigger = DropdownMenuPrimitive.Trigger;
const Group = DropdownMenuPrimitive.Group;
const RadioGroup = DropdownMenuPrimitive.RadioGroup;

import Content from "./dropdown-menu-content.svelte";
import Item from "./dropdown-menu-item.svelte";
import Label from "./dropdown-menu-label.svelte";
import Separator from "./dropdown-menu-separator.svelte";

export {
	Sub,
	Root,
	Trigger,
	Group,
	RadioGroup,
	Content,
	Item,
	Label,
	Separator,
	Root as DropdownMenu,
	Content as DropdownMenuContent,
	Item as DropdownMenuItem,
	Label as DropdownMenuLabel,
	Separator as DropdownMenuSeparator,
	Trigger as DropdownMenuTrigger,
	Group as DropdownMenuGroup,
	RadioGroup as DropdownMenuRadioGroup,
	Sub as DropdownMenuSub,
};
