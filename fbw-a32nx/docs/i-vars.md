# I Vars

An IVar is a variable with the `I:` prefix, like `I:XMLVAR_Auto`.

It's like a SimVar (`A:`) or LocalVar (`L:`), but just different in some way that we don't know yet.

We don't know what the `I` means yet.

## How to have a switch that only has an `I` var (AKA IVar) have a default value from an `.flt` file.

So, you have a switch in the plane that you want to set a default value for via the `.flt` files.

And you've determined that the backing variable for the switch is an IVar.

We haven't found a way to set it directly from the `/flt` files, but we have a workaround.

The trick is to make use of an `<Update Once="True">` element, to copy the value from a LocalVar to the IVar.

Add a LocalVar to the `.flt` files with the same name of the IVar that it will be copied to (you can name it whatever you want really).

```
[LocalVars.0]
XMLVAR_ALT_MODE_REQUESTED=1
```

And add the Update element to the Component containing the IVar.

```xml
<Component ID="#KNOB_XPNDR_ON_OFF_NODE_ID#" Node="#KNOB_XPNDR_ON_OFF_NODE_ID#">
    <!-- The Update element belongs in the Component scope, it won't work in the UseTemplate scope -->
    <Update Once="True">
        <!-- This copies the value from the LocalVar (set in the .flt files) to the IVar -->
        (L:XMLVAR_ALT_MODE_REQUESTED) (&gt;I:XMLVAR_ALT_MODE_REQUESTED)
        <!-- This is copied from the LEFT_SINGLE_CODE element below so as not to break any existing functionality -->
        #UPDATE_AUTO_TRANSPONDER_STATE#
    </Update>
    <UseTemplate Name="ASOBO_GT_Switch_Code">
        <LEFT_SINGLE_CODE>
            (I:XMLVAR_ALT_MODE_REQUESTED) ! (&gt;I:XMLVAR_ALT_MODE_REQUESTED)
            #UPDATE_AUTO_TRANSPONDER_STATE#
        </LEFT_SINGLE_CODE>
        <ANIM_CODE>(I:XMLVAR_ALT_MODE_REQUESTED) 100 *</ANIM_CODE>
        <ANIM_NAME>#KNOB_XPNDR_ON_OFF_ANIM_NAME#</ANIM_NAME>
        <ANIMTIP_0>TT:COCKPIT.TOOLTIPS.ATC_ALT_RPTG_TURN_OFF</ANIMTIP_0>
        <ANIMTIP_1>TT:COCKPIT.TOOLTIPS.ATC_ALT_RPTG_TURN_ON</ANIMTIP_1>
    </UseTemplate>
</Component>
```

That should be it!
