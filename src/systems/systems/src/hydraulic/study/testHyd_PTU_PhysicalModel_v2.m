global STATIC_LEAK_FLOW; 
global DELTA_VOL_LOW_PASS_FILTER;

STATIC_LEAK_FLOW = 0.04;
DELTA_VOL_LOW_PASS_FILTER=0.4;

%HYD LOOP
%YELLOW LOOP%%
loopY.bulkModulus=1450000000;%Bulk for fluid NSA307110
loopY.volume=19.81;
loopY.maxVolume=19.81;
loopY.maxVolumeHighPressureSide=10;
loopY.res=3.6;    %
loopY.press=14.7;
loopY.delta_vol=0;

loopY.accumulator_fluid_volume=0;
loopY.hasAccu=1;
loopY.ACCUMULATOR_MAX_VOLUME=0.264; %gallons
loopY.ACCUMULATOR_GAS_PRECHARGE=1885;
loopY.accumulator_gas_pressure=loopY.ACCUMULATOR_GAS_PRECHARGE;
loopY.accumulator_gas_volume=loopY.ACCUMULATOR_MAX_VOLUME;
loopY.accumulator_DeltaPressBreakpoints= [0   1    5    50   100  200  500  1000 2000 3100];
loopY.accumulator_DeltaPressFlowCarac  = [0 0.001 0.005 0.05 0.08 0.15 0.25 0.35  0.5  0.5];
loopY.accumulator_deltavol = 0;
loopY.accumulator_flow = 0;
loopY.accumulator_damping_coeff= 0.7;
loopY.connected_to_ptu_left_side=0;%%Connected to right side of a PTU
loopY.current_max_flow=0;
loopY.ptu_active=0;
%YELLOW END%

%Yellow no accum LOOP%%
loopG=loopY;
loopG.volume=26.41;
loopG.maxVolume=26.41;
loopG.maxVolumeHighPressureSide=15;
loopG.res=3.6;    %
loopG.connected_to_ptu_left_side=1;%%Connected to right side of a PTU
%YELLOW END%

epump.rpm=0;
epump.currentDisp=0;
epump.flowRate=0;
epump.delta_vol=0;
epump.pressBreakpoints= [0      500     1000    1500 2800    2980   3000 3050 3500];
epump.displacementCarac=[0.263  0.263  0.263   0.263 0.263  0.263   0.100   0   0 ];
epump.minVol=0;
epump.maxVol=0;
epump.rpmMax=7600;
epump.spooltime=4;
epump.isactive=0;
epump.displacementFilterConst=0.95;

pumpED1.rpm=0;
pumpED1.flowRate=0;
pumpED1.delta_vol=0;
pumpED1.pressBreakpoints=[0 500 1000 1500 2800 2950 3000 3020 3500];
pumpED1.displacementCarac=[2.4 2.4 2.4 2.4 2.4 2.4 2   0 0 ];
pumpED1.minVol=0;
pumpED1.maxVol=0;
pumpED1.isactive=0;
pumpED1.currentDisp=0;
pumpED1.displacementFilterConst=0.3;

ptu.is_enabled=1;
ptu.flow_to_left=0;
ptu.flow_to_right=0;
ptu.is_active_left=0;
ptu.is_active_right=0;
ptu.last_flow=0;
ptu.last_delta_p=0;
%ptu.AGRESSIVENESS_FACTOR=1;
%ptu.FLOW_DYNAMIC_LOW_PASS_LEFT_SIDE=0.35;
%ptu.FLOW_DYNAMIC_LOW_PASS_RIGHT_SIDE=0.35;
ptu.EFFICIENCY_RIGHT_TO_LEFT_SIDE=0.7;
ptu.EFFICIENCY_LEFT_TO_RIGHT_SIDE=0.81;

ptu.right_displacement=0.92;%15 cm3/rev
ptu.left_displacement=0.92;%12.5 cm3/rev;
% ptu.pressBreakpoints=[-500   -250  -50    -10        -5                         5                 10          50  150  250   500   ];
% ptu.displacementCarac=[0.65    0.65  0.65    0.65  ptu.left_displacement    ptu.left_displacement    1.0      1.0   1.05 1.11   1.21 ];
 ptu.pressBreakpoints=[-500   -250  -100        -50     -20                         0                    20                     100            250   500   ];
 ptu.displacementCarac=[0.65  0.65  0.65        0.65  0.65   ptu.left_displacement ptu.left_displacement      1.10     1.21  1.21 ];



ptu.shaft.speed=0;
ptu.shaft.rpm=0;
ptu.shaft.acc=0;
ptu.shaft.inertia=0.015;
ptu.shaft.left_side_torque=0;
ptu.shaft.right_side_torque=0;
ptu.shaft.friction=0.05;
ptu.shaft.static_friction=15;

dt=0.1;

YloopVolTab=[];
YloopFlowTab=[];
epumpDispTab=[];
YpressTab=[];
Yacc_flow_tab=[];
Yacc_fluid_vol=[];

GloopFlowTab=[];
GpressTab=[];

ptuLeftFlowTab=[];
ptuRightFlowTab=[];

time=0:dt:150;


ptu_rpm_tab=[];
ptu_left_trq_tab=[];
ptu_right_trq_tab=[];
ptu_total_trq_tab=[];
ptu_right_disp_tab=[];
ptu_left_disp_tab=[];


for t=time
    ptu.is_enabled=1;
    if t>1
        epump.rpm=epump.rpmMax;
        pumpED1.rpm=0;
    end
    
    if t>30 && t<100
        pumpED1.rpm=16500*0.211;
    end
    
    if t>50 && t< 75
        epump.rpm=0;
    end
    
    if t > 100
        pumpED1.rpm=0;
        epump.rpm=0;
    end
    
%     if t>10 && t <10.5 || t>11 && t <11.5 || t>12 && t <12.5
%         flow_eaten=0.56;
%         actuator.volume_to_actuator_accumulator=flow_eaten*dt * 0.5 + 0.5*actuator.volume_to_actuator_accumulator;
%         actuator.volume_to_res_accumulator=actuator.volume_to_actuator_accumulator;
%     else
%         actuator.volume_to_actuator_accumulator=0;
%         actuator.volume_to_res_accumulator=0;
%     end
    
    if t>100
        epump.rpm=0;
        pumpED1.rpm=0;
    end
    
    [epump,loopY,ptu]= updateL(dt,epump,loopY,ptu);
    [pumpED1,loopG,ptu]= updateL(dt,pumpED1,loopG,ptu);
    
    
    %%PTU MODEL START
    ptu=update_ptu_motor_torques(ptu, loopG, loopY);
    ptu = updateHydMotorPhysics(ptu,dt); 
    ptu = updateflows(ptu);
    %%PTU MODEL END
    
    ptu_rpm_tab(end+1)=ptu.shaft.rpm;
    ptu_left_trq_tab(end+1)=ptu.shaft.left_side_torque;
    ptu_right_trq_tab(end+1)=ptu.shaft.right_side_torque;
    ptu_total_trq_tab(end+1)=ptu.shaft.right_side_torque+ptu.shaft.left_side_torque;
    
    ptu_left_disp_tab(end+1)=ptu.left_displacement;
    ptu_right_disp_tab(end+1)=ptu.right_displacement;
    
            
    ptu.shaft.left_side_torque=0;
    ptu.shaft.right_side_torque=0;
    


   
    
  
    YloopFlowTab(end+1)=loopY.delta_vol/dt; %To rad/s to RPM
    epumpDispTab(end+1)=epump.currentDisp;
    YpressTab(end+1)=loopY.press;
    YloopVolTab(end+1)=loopY.volume;
    Yacc_flow_tab(end+1)=loopY.accumulator_flow;
    Yacc_fluid_vol(end+1)=loopY.accumulator_fluid_volume;
    
    GloopFlowTab(end+1)=loopG.delta_vol/dt; %To rad/s to RPM
    GpressTab(end+1)=loopG.press;
    
    ptuLeftFlowTab(end+1)=ptu.flow_to_left;
    ptuRightFlowTab(end+1)=ptu.flow_to_right;
    

end


figure;
ax_rpm=subplot(6,1,1);
hold(ax_rpm,'on');grid;
ylabel('rpm');
title('PTU rpm');
plot(ax_rpm,time,ptu_rpm_tab );

ax_TrqPtu=subplot(6,1,2);
hold(ax_TrqPtu,'on');grid;
title('PTU torques');
ylabel('trq(Nm)');
plot(ax_TrqPtu,time,ptu_left_trq_tab );
plot(ax_TrqPtu,time,ptu_right_trq_tab );
plot(ax_TrqPtu,time,ptu_total_trq_tab );
legend({'left' 'right' 'total'});

ax_DispPtu=subplot(6,1,3);
hold(ax_DispPtu,'on');grid;
title('PTU displacements');
ylabel('disp (in^2/rev)');
plot(ax_DispPtu,time,ptu_right_disp_tab,'color','#F80' );
plot(ax_DispPtu,time,ptu_left_disp_tab,'color','green' );

ax_FlowPtu=subplot(6,1,4);
hold(ax_FlowPtu,'on');grid;
title('PTU flows');
ylabel('gal/s');
plot(ax_FlowPtu,time,ptuRightFlowTab,'color','#F80' );
plot(ax_FlowPtu,time,ptuLeftFlowTab,'color','green' );


ax_LoopPressPtu=subplot(6,1,5);
hold(ax_LoopPressPtu,'on');grid;
title('Loop pressures');
ylabel('press(psi)');
plot(ax_LoopPressPtu,time,YpressTab,'color','#F80' );
plot(ax_LoopPressPtu,time,GpressTab,'color','green' );





linkaxes([ax_rpm,ax_TrqPtu,ax_DispPtu,ax_FlowPtu,ax_LoopPressPtu],'x');



figure;
ax_press=subplot(6,1,1);
hold(ax_press,'on');grid;
title('Yellow/Green pressure (psi)');
plot(ax_press,time,YpressTab,'color','#F80'); plot(ax_press,time,GpressTab,'color','green');
legend({'Yellow' 'Green'});
ylabel('press(psi)');
ax_pumpFlow=subplot(6,1,2);
hold(ax_pumpFlow,'on');grid;
title('Loop Flow');
plot(ax_pumpFlow,time,YloopFlowTab,'color','#F80');plot(ax_pumpFlow,time,GloopFlowTab,'color','green');
ylabel('flow(gal/s)');
ax_pumpDisp=subplot(6,1,3);
hold(ax_pumpDisp,'on');grid;
title('Pump displacement');
ylabel('Displacement(in^2)');
plot(ax_pumpDisp,time,epumpDispTab);
ax_accFlow=subplot(6,1,4);
hold(ax_accFlow,'on');grid;
plot(ax_accFlow,time,Yacc_flow_tab);
ylabel('flow(gal/s)');
title('Accum flow');

ax_AccumFluidVol=subplot(6,1,5);
hold(ax_AccumFluidVol,'on');grid;
title('Acc fluid vol');
plot(ax_AccumFluidVol,time,Yacc_fluid_vol);
ylabel('Vol(gal)');

ax_PtuFlow=subplot(6,1,6);
hold(ax_PtuFlow,'on');grid;
title('PTU flow');
plot(ax_PtuFlow,time,ptuRightFlowTab,'color','#F80');plot(ax_PtuFlow,time,ptuLeftFlowTab,'color','green');
ylabel('flow(gal/s)');

linkaxes([ax_press,ax_pumpFlow,ax_pumpDisp,ax_accFlow,ax_AccumFluidVol,ax_PtuFlow],'x');


function torque = updateHydMotorTorque(pressure,displacement)
    trq_inch_pounds =  pressure * displacement / (2*3.14);
    torque = trq_inch_pounds * 0.112982933 ;%in pounds to NM
end


function ptu=update_displacement(ptu, loop_left, loop_right)
    delta_p_raw = loop_left.press - loop_right.press;
    delta_p_filt= delta_p_raw * 0.99 + (1-0.99)* ptu.last_delta_p;
    ptu.last_delta_p=delta_p_filt;
    

    ptu.right_displacement=interp1(ptu.pressBreakpoints,ptu.displacementCarac,max(min(-delta_p_filt,ptu.pressBreakpoints(end)),ptu.pressBreakpoints(1)));       

    
    if ptu.right_displacement < ptu.left_displacement
            ptu.is_active_left=1;
            ptu.is_active_right=0;
    elseif ptu.right_displacement > ptu.left_displacement
        ptu.is_active_left=0;
        ptu.is_active_right=1;
    else
        ptu.is_active_left=0;
        ptu.is_active_right=0;
    end
end

function torque = calc_pump_torque(pressure,displacement)
    torque=updateHydMotorTorque(pressure,displacement);
end


function ptu = updateflows(ptu)
    
    if  ptu.shaft.speed < - 0.1
        %Left sends flow to right
        vr=calculate_flow(abs(ptu.shaft.rpm), ptu.left_displacement);
        
        ptu.flow_to_left = -vr;
        ptu.flow_to_right = vr * ptu.EFFICIENCY_LEFT_TO_RIGHT_SIDE;
        ptu.last_flow = vr;

        %ptu.is_active_left = true;
    elseif ptu.shaft.speed > 0.1
        %Right sends flow to left
        vr=calculate_flow(abs(ptu.shaft.rpm), ptu.right_displacement);
 
        ptu.flow_to_left =(vr * ptu.EFFICIENCY_RIGHT_TO_LEFT_SIDE);
        ptu.flow_to_right = (-vr);
        ptu.last_flow = (vr);

        %ptu.is_active_right = true;
    else
       % ptu.is_active_right = false;
       % ptu.is_active_left = false;
        ptu.flow_to_left =0;
        ptu.flow_to_right = 0;
    end

end
    
function ptu=update_ptu_motor_torques(ptu, loop_left, loop_right)
    ptu=update_displacement(ptu, loop_left, loop_right);

    generated_torque_left_side= -updateHydMotorTorque(loop_left.press,ptu.left_displacement);
    ptu.shaft.left_side_torque=ptu.shaft.left_side_torque+generated_torque_left_side;

    generated_torque_right_side= updateHydMotorTorque(loop_right.press,ptu.right_displacement);
    ptu.shaft.right_side_torque=ptu.shaft.right_side_torque+generated_torque_right_side;

end

function ptu = updateHydMotorPhysics(ptu,dt)
    friction_torque = ptu.shaft.friction* -ptu.shaft.speed;
    
    total_torque=friction_torque + ptu.shaft.left_side_torque + ptu.shaft.right_side_torque;
    
    if abs(ptu.shaft.rpm) > 500 || abs(total_torque) > ptu.shaft.static_friction
        ptu.shaft.acc= total_torque /  ptu.shaft.inertia;
        ptu.shaft.speed=ptu.shaft.speed + ptu.shaft.acc * dt;
        ptu.shaft.rpm=ptu.shaft.speed*9.5492965964254;
    else
        ptu.shaft.acc= 0;
        ptu.shaft.speed=0;
        ptu.shaft.rpm=0;
    end
end

function [pump]=updateP_min_max(dt, pump, loop)
        theoretical_displacement = calculate_displacement(pump,loop);
        pump.currentDisp=theoretical_displacement * pump.displacementFilterConst + (1-pump.displacementFilterConst) * pump.currentDisp;
        
        flow_Gall_per_s = calculate_flow(pump.rpm, pump.currentDisp);
        delta_vol_gall = flow_Gall_per_s * dt;

        pump.maxVol=delta_vol_gall;
        pump.minVol=0; %Min is 0 as it can cut off displacement to 0 for EDP
end

function disp=calculate_displacement(pump,loop)
    limited_x=max(pump.pressBreakpoints(1),min(loop.press,pump.pressBreakpoints(end)));
    disp=interp1(pump.pressBreakpoints,pump.displacementCarac,limited_x);
end

function flow= calculate_flow(rpm, displacement)
        flow= (rpm * displacement / 231.0 / 60.0);
end

   
function [loop,delta_vol,reservoir_return]= update_ptu_flows(loop,dt,delta_vol,reservoir_return,ptu)
        ptu_act = false;

        actual_flow=0;
        if loop.connected_to_ptu_left_side
            if ptu.is_active_left || ptu.is_active_right
                ptu_act = true;
            end
            if ptu.flow_to_left > 0.0 
                %We are left side of PTU and positive flow so we receive flow using own reservoir
                actual_flow = ptu.flow_to_left;
%                 actual_flow = self.get_usable_reservoir_flow(
%                     ptu.flow_to_left,
%                     Time::new::<second>(delta_time.as_secs_f64()),
%                 );
                loop.res =  loop.res-actual_flow * dt;
            else 
%                 // We are using own flow to power right side so we send that back
%                 // to our own reservoir
                actual_flow = ptu.flow_to_left;
                reservoir_return = reservoir_return -	 actual_flow * dt;
            end
            delta_vol = delta_vol + actual_flow * dt;
        elseif ~loop.connected_to_ptu_left_side
            if ptu.is_active_left || ptu.is_active_right
                ptu_act = true;
            end
            if ptu.flow_to_right > 0
                %We are right side of PTU and positive flow so we receive flow using own reservoir
                actual_flow =  ptu.flow_to_right;
%                 actual_flow = self.get_usable_reservoir_flow(
%                     ptu.flow_to_right,
%                     Time::new::<second>(delta_time.as_secs_f64()),
%                 );
                loop.res = loop.res -    actual_flow * dt;
            else
%                 // We are using own flow to power left side so we send that back
%                 // to our own reservoir
                actual_flow = ptu.flow_to_right;
                reservoir_return = reservoir_return - actual_flow * dt;
            end
            delta_vol = delta_vol + actual_flow * dt;
        end
        
        loop.ptu_active = ptu_act;
end

function [pump,loop,ptu]= updateL(dt,pump,loop,ptu)
global STATIC_LEAK_FLOW;
global DELTA_VOL_LOW_PASS_FILTER;

    %init
    deltavol=0;
    deltaMaxVol=0;
    deltaMinVol=0;
    %deltaVolConsumers=0; %%Total volume consumed this iteration
    reservoirReturn=0; %%total volume back to res for that iteration


    %FOR EACH PUMP getting max and min flow available. Will be used at end
    %of iteration to fullfill if possible the regulation to 3000 nominal
    %pressure
        pump=updateP_min_max(dt,pump,loop);

        deltaMaxVol=deltaMaxVol+pump.maxVol;
        deltaMinVol=deltaMinVol+pump.minVol;
    %END FOREACH PUMP
    loop.current_max_flow=deltaMaxVol/dt;



    %Static leaks, random formula to depend on pressure
    staticLeakVol=STATIC_LEAK_FLOW*dt*(loop.press-14.7)/3000;
    deltavol=deltavol-staticLeakVol;

    reservoirReturn=reservoirReturn+staticLeakVol; %Static leaks are back to reservoir unless failure case
    %%%end static leaks

 
    
    %%%%%%%%%%%%%%%%%%%%%%%%%%ACCUMULATOR%%%%%%%%%%%%
    if loop.hasAccu
        [deltavol,loop] = loop_acum_update(deltavol,dt,loop);
    end
    
    [loop,deltavol,reservoirReturn]= update_ptu_flows(loop,dt,deltavol,reservoirReturn,ptu);
    
    %%%%%%%%%%%%%%%%%%%END ACCUMULATOR%%%%%%%%%%%%%%%%
    %Unprimed case
    %Here we handle starting with air in the loop
    if loop.volume < loop.maxVolume %TODO what to do if we are back under max volume and unprime the loop?
        difference = loop.maxVolume - loop.volume;
        availableFluidVol=min(loop.res,deltaMaxVol);
        delta_loop_vol = min(availableFluidVol,difference);
        deltaMaxVol = deltaMaxVol-delta_loop_vol; %TODO check if we cross the deltaVolMin?
        loop.volume = loop.volume+ delta_loop_vol;
        loop.res=loop.res-delta_loop_vol;
    end

    



    %%%%UPDATE ALL ACTUATORS OF THIS LOOP
    used_fluidQty=0; %%total fluid used
    actuatorsResReturn=0;
    
    

%     used_fluidQty=used_fluidQty+actuator.volume_to_actuator_accumulator;
%     reservoirReturn = reservoirReturn+actuator.volume_to_res_accumulator;


%     actuator.volume_to_actuator_accumulator=0;
%     actuator.volume_to_res_accumulator=0;
    
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    %Update pressure and vol from last used flow by actuators
    deltavol=deltavol-used_fluidQty;


    

    %How much we need to reach target of 3000?
    volume_needed_to_reach_pressure_target = vol_to_target(loop,3000);

    %Actually we need this PLUS what is used by consumers.
    volume_needed_to_reach_pressure_target = volume_needed_to_reach_pressure_target - deltavol;

    %Now computing what we will actually use from flow providers limited by
    %their min and max flows and reservoir availability
    actual_volume_added_to_pressurise = min(loop.res,max(deltaMinVol,min(deltaMaxVol,volume_needed_to_reach_pressure_target)));
    deltavol=deltavol+actual_volume_added_to_pressurise;
    
    %Update res
    loop.res=loop.res-actual_volume_added_to_pressurise; %limit to 0 min? for case of negative added?
    loop.res=loop.res+reservoirReturn;
    
    %Update Volumes
    loop.volume=loop.volume+deltavol;
    
    loop.delta_vol=DELTA_VOL_LOW_PASS_FILTER*deltavol + (1-DELTA_VOL_LOW_PASS_FILTER)*loop.delta_vol;

    %Loop Pressure update From Bulk modulus
    loop.press= max(14.7,loop.press + deltaPress_from_deltaVolume(loop.delta_vol,loop));
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    
    loop.current_flow=loop.delta_vol*dt;
end

function [deltavol,loop]= loop_acum_update(deltavol,dt,loop)
    accumulatorDeltaPress = loop.accumulator_gas_pressure - loop.press;
    limited_deltaPress=abs(accumulatorDeltaPress);
    limited_deltaPress=min(limited_deltaPress,loop.accumulator_DeltaPressBreakpoints(end));
    flowVariation = interp1(loop.accumulator_DeltaPressBreakpoints,loop.accumulator_DeltaPressFlowCarac,abs(limited_deltaPress)) ;
    flowVariation= flowVariation*loop.accumulator_damping_coeff +  loop.accumulator_flow * (1-loop.accumulator_damping_coeff);
%     %%TODO HANDLE OR CHECK IF RESERVOIR AVAILABILITY is OK
%     %%TODO check if accumulator can be used as a min/max flow producer to
%     %%avoid it being a consumer that might unsettle pressure
    if ( accumulatorDeltaPress > 0 )
        volumeFromAcc = min(loop.accumulator_fluid_volume, flowVariation * dt );
        loop.accumulator_fluid_volume=loop.accumulator_fluid_volume-volumeFromAcc;
        loop.accumulator_gas_volume=loop.accumulator_gas_volume+volumeFromAcc;
        deltavol = deltavol + volumeFromAcc;
        loop.accumulator_deltavol=-volumeFromAcc;  
    else
        volumeToAcc = max(max(0,deltavol), flowVariation * dt );
        %volumeToAcc = flowVariation * dt ;%TODO handle if flow actually available: maybe using deltavolMAX
        loop.accumulator_fluid_volume=loop.accumulator_fluid_volume+volumeToAcc;
        loop.accumulator_gas_volume=loop.accumulator_gas_volume-volumeToAcc;
        deltavol = deltavol - volumeToAcc;
        loop.accumulator_deltavol=volumeToAcc;
    end

    loop.accumulator_flow=loop.accumulator_deltavol/dt;
    loop.accumulator_gas_pressure = (loop.ACCUMULATOR_GAS_PRECHARGE * loop.ACCUMULATOR_MAX_VOLUME) / (loop.ACCUMULATOR_MAX_VOLUME - loop.accumulator_fluid_volume);

end

function deltaPress = deltaPress_from_deltaVolume(deltaV,loop)
	delta_vol_m3=deltaV * 0.00378541178; %Convert to m3
	deltaP_pascal=((delta_vol_m3) / (loop.maxVolumeHighPressureSide* 0.00378541178)) * loop.bulkModulus;

    deltaPress = deltaP_pascal*0.0001450377;
end

function volume_needed_to_reach_pressure_target_gal = vol_to_target(loop,targetPress)
    volume_needed_to_reach_pressure_target_m3 = (targetPress-loop.press)/0.0001450377 * (loop.maxVolumeHighPressureSide* 0.00378541178) / loop.bulkModulus;
    volume_needed_to_reach_pressure_target_gal = volume_needed_to_reach_pressure_target_m3 / 0.00378541178;
end