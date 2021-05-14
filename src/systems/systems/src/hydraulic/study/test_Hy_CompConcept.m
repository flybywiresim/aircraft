
actuator=[];

%GREEN LOOP%%
loopG.bulkModulus=1450000000; %Bulk for fluid NSA307110
loopG.length=10;
loopG.volume=26.41;
loopG.maxVolume=26.41;
loopG.maxVolumeHighPressureSide=8; %Considering 10gal is the high pressure volume TODO get realistic value
loopG.res=3.83;    %  14.5L
loopG.press=14.7;
loopG.delta_vol=0;

loopG.accumulator_fluid_volume=0;
loopG.ACCUMULATOR_MAX_VOLUME=0.264; %gallons
loopG.ACCUMULATOR_GAS_NRT=128.26;
loopG.ACCUMULATOR_GAS_PRECHARGE=1885;
loopG.accumulator_gas_pressure=loopG.ACCUMULATOR_GAS_PRECHARGE;
loopG.accumulator_gas_volume=loopG.ACCUMULATOR_MAX_VOLUME;
loopG.accumulator_DeltaPressBreakpoints= [0 5 10 50 100 200 500 1000 10000];
loopG.accumulator_DeltaPressFlowCarac  =[0 0.005 0.008 0.01 0.02 0.08 0.15 0.35 0.5];
loopG.isLeft=1; %%Connected to left side of a PTU
%END GREEN%

%YELLOW LOOP%%
loopY.bulkModulus=1450000000;%Bulk for fluid NSA307110
loopY.length=10;
loopY.volume=10.2;
loopY.maxVolume=10.2;
loopY.maxVolumeHighPressureSide=8;
loopY.res=3.3;    %
loopY.press=14.7;
loopY.delta_vol=0;

loopY.accumulator_fluid_volume=0;
loopY.ACCUMULATOR_MAX_VOLUME=0.264; %gallons
loopY.ACCUMULATOR_GAS_NRT=128.26;
loopY.ACCUMULATOR_GAS_PRECHARGE=1885;
loopY.accumulator_gas_pressure=loopY.ACCUMULATOR_GAS_PRECHARGE;
loopY.accumulator_gas_volume=loopY.ACCUMULATOR_MAX_VOLUME;
loopY.accumulator_DeltaPressBreakpoints= [0 5 10 50 100 200 500 1000 10000];
loopY.accumulator_DeltaPressFlowCarac  =[0 0.005 0.008 0.01 0.02 0.08 0.15 0.35 0.5];
loopY.isLeft=0;%%Connected to right side of a PTU
%YELLOW END%

PTU.flowToLeftLoop=0;
PTU.flowToRightLoop=0;
PTU.resReturnLeftLoop=0;
PTU.resReturnRightLoop=0;
PTU.isActiveRight=0;
PTU.isActiveLeft=0;
PTU.isEnabled=0;
% Yellow to Green
% /// ---------------
% /// 34 GPM (130 L/min) from Yellow system
% /// 24 GPM (90 L/min) to Green system
% /// Maintains constant pressure near 3000PSI in green
% ///
% /// Green to Yellow
% /// ---------------
% /// 16 GPM (60 L/min) from Green system
% /// 13 GPM (50 L/min) to Yellow system
% /// Maintains constant pressure near 3000PSI in yellow


pumpED1.rpm=0;
pumpED1.flowRate=0;
pumpED1.max_displacement=2.4;
pumpED1.delta_vol=0;
pumpED1.pressBreakpoints=[0 500 1000 1500 2800 2900 3000 3050 3500];
pumpED1.displacementCarac=[2.4 2.4 2.4 2.4 2.4 2.4 2.0 0 0 ];
pumpED1.minVol=0;
pumpED1.maxVol=0;


pumpED2.rpm=0;
pumpED2.flowRate=0;
pumpED2.max_displacement=2.4;
pumpED2.delta_vol=0;
pumpED2.pressBreakpoints=[0 500 1000 1500 2800 2900 3000 3050 3500];
pumpED2.displacementCarac=[2.4 2.4 2.4 2.4 2.4 2.4 2.0 0 0 ];
pumpED2.minVol=0;
pumpED2.maxVol=0;

dt=0.1;

displacementTab=[];

pressTabG=[];
deltaVolTabG=[];
volTabG=[];
loopFlowG=[];
resTabG=[];
accFluidVolumeTabG=[];
accGasVolumeTabG=[];
accGasPressTabG=[];

pressTabY=[];
deltaVolTabY=[];
volTabY=[];
loopFlowY=[];
resTabY=[];
accFluidVolumeTabY=[];
accGasVolumeTabY=[];
accGasPressTabY=[];

PTU_Flow_GToY_tab=[];
PTU_Flow_YToG_tab=[];
PTU_DeltaP_tab=[];
PTU_isActive_tab=[];


close all;

lastT=0;
maxTime=100;




%%%%%STARTING SCRIPT%%%%%%%%%
for t=0:dt:maxTime

    if t==0
        pumpED2.rpm=0;
        pumpED1.rpm=0;
    end

    if t==1
        pumpED2.rpm=4000;
        pumpED1.rpm=4000;
        %loop.press =1;
        %loop.volume=loop.volume*0.25;
        %pumpED2.rpm=0;
    end

    if t==5
        pumpED1.rpm=0;
        PTU.isEnabled = 1;
    end


    PTU=updatePTU(PTU,dt, loopG, loopY) ;

    [pumpED1,loopG,actuator]= updateL(dt,pumpED1,PTU,loopG,actuator);
    [pumpED2,loopY,actuator]= updateL(dt,pumpED2,PTU,loopY,actuator);

%     physicsFixedStep=0.05;
%     numOfPasses=dt/physicsFixedStep;
%
%     for passNum=1:numOfPasses
%           gear=updateActuator(gear,physicsFixedStep);
%     end


    %MATLAB DISPLAY ONLY
    pressTabG(end+1)=loopG.press;
    deltaVolTabG(end+1)=loopG.delta_vol;
    volTabG(end+1)=loopG.volume;
    loopFlowG(end+1)=loopG.delta_vol/dt;
    resTabG(end+1)=loopG.res;

    accFluidVolumeTabG(end+1)=loopG.accumulator_fluid_volume;
    accGasVolumeTabG(end+1)  =  loopG.accumulator_gas_volume ;
    accGasPressTabG(end+1)   =  loopG.accumulator_gas_pressure ;

    pressTabY(end+1)=loopY.press;
    deltaVolTabY(end+1)=loopY.delta_vol;
    volTabY(end+1)=loopY.volume;
    loopFlowY(end+1)=loopY.delta_vol/dt;
    resTabY(end+1)=loopY.res;

    accFluidVolumeTabY(end+1)=loopY.accumulator_fluid_volume;
    accGasVolumeTabY(end+1)  =  loopY.accumulator_gas_volume ;
    accGasPressTabY(end+1)   =  loopY.accumulator_gas_pressure ;

    PTU_Flow_GToY_tab(end+1)=PTU.flowToRightLoop;
    PTU_Flow_YToG_tab(end+1)=PTU.flowToLeftLoop;
    PTU_DeltaP_tab(end+1)=loopG.press-loopY.press;
    PTU_isActive_tab(end+1)=PTU.isActiveLeft||PTU.isActiveRight;
end

t=0:dt:maxTime    ;
%figure; plot(angleTab,displacementTab);

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
figure;
ax_PTU_flow=subplot(5,1,1);
hold(ax_PTU_flow,'on');grid;
title('PTUflow');
ax_deltaP=subplot(5,1,2);
hold(ax_deltaP,'on');grid;
title('DeltaP');
ax_active=subplot(5,1,3);
hold(ax_active,'on');grid;
title('PTU active');
ax_loopPress=subplot(5,1,4);
hold(ax_loopPress,'on');grid;
title('LoopPressures');
ax_ResVol=subplot(5,1,5);
hold(ax_ResVol,'on');grid;
title('ResVol');

plot(ax_PTU_flow,t,PTU_Flow_GToY_tab,'color','red');
plot(ax_PTU_flow,t,PTU_Flow_YToG_tab,'color','green');

plot(ax_deltaP,t,PTU_DeltaP_tab);

plot(ax_active,t,PTU_isActive_tab);

plot(ax_loopPress,t,pressTabG,'color','green');
plot(ax_loopPress,t,pressTabY,'color','red');

plot(ax_ResVol,t,resTabG,'color','green');
plot(ax_ResVol,t,resTabY,'color','red');
linkaxes([ax_PTU_flow,ax_deltaP,ax_active,ax_loopPress,ax_ResVol],'x');

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
figure;
ax_Press=subplot(5,1,1);
hold(ax_Press,'on');grid;
title('Press');
ax_deltaVol=subplot(5,1,2);
hold(ax_deltaVol,'on');grid;
title('DeltaVol');
ax_Volume=subplot(5,1,3);
hold(ax_Volume,'on');grid;
title('Vol');
ax_deltaFlow=subplot(5,1,4);
hold(ax_deltaFlow,'on');grid;
title('deltaFlow');
ax_ResVol=subplot(5,1,5);
hold(ax_ResVol,'on');grid;
title('ResVol');


plot(ax_Press,t,pressTabG,'color','green');hold on;
plot(ax_Press,t,pressTabY,'color','red');

plot(ax_deltaVol,t,deltaVolTabG,'color','green');
plot(ax_deltaVol,t,deltaVolTabY,'color','red');

plot(ax_Volume,t,volTabG,'color','green');
plot(ax_Volume,t,volTabY,'color','red');

plot(ax_deltaFlow,t,loopFlowG,'color','green');
plot(ax_deltaFlow,t,loopFlowY,'color','red');

plot(ax_ResVol,t,resTabG,'color','green');
plot(ax_ResVol,t,resTabY,'color','red');

linkaxes([ax_Press,ax_deltaVol,ax_Volume,ax_PumpVol,ax_ResVol],'x');



time=0:dt:maxTime    ;
figure;
ax_accVol=subplot(2,1,1);
hold(ax_accVol,'on');grid;
title('Accumulator Volumes');
ax_accPress=subplot(2,1,2);
hold(ax_accPress,'on');grid;
title('Accumulator pressure');

plot(ax_accVol,time,accFluidVolumeTabG);
plot(ax_accVol,time,accGasVolumeTabG);
legend(ax_accVol,{'Acc FluidVol' 'Acc Gas Vol'});
plot(ax_accPress,time,accGasPressTabG);
plot(ax_accPress,time,pressTabG);
legend(ax_accPress,{'Acc Press' 'Loop press'});
linkaxes([ax_accVol,ax_accPress],'x');



function [pump]=updateP_min_max(dt, pump, loop)
        displacement = calculate_displacement(pump,loop);
        flow_Gall_per_s = calculate_flow(pump.rpm, displacement);
        delta_vol_gall = flow_Gall_per_s * dt;

        pump.maxVol=delta_vol_gall;
        pump.minVol=0; %Min is 0 as it can cut off displacement to 0 for EDP
end

function PTU=updatePTU(PTU,dt, loopLeft, loopRight)

    if PTU.isEnabled
        deltaP=loopLeft.press-loopRight.press;

        %TODO: use maped characteristics for PTU?
        %TODO Use variable displacement available on one side?
        %TODO Handle RPM of ptu so transient are bit slower?
        %TODO Handle it as a min/max flow producer
        if PTU.isActiveLeft || deltaP>500 %Left sends flow to right
            vr = min(16,loopLeft.press * 0.01133) / 60.0;
            PTU.flowToLeftLoop= -vr;
            PTU.flowToRightLoop= vr * 0.81;

            PTU.isActiveLeft=1;
        elseif PTU.isActiveRight || deltaP<-500 %Right sends flow to left
            vr = min(34,loopRight.press * 0.0245) / 60.0;
            PTU.flowToLeftLoop = vr * 0.70;
            PTU.flowToRightLoop= -vr;

            PTU.isActiveRight=1;
        end

        if PTU.isActiveRight && loopLeft.press > 2950 || PTU.isActiveLeft && loopRight.press > 2950 ...
            || PTU.isActiveRight && loopRight.press  < 200 ...
            || PTU.isActiveLeft && loopLeft.press  < 200
            PTU.flowToLeftLoop=0;
            PTU.flowToRightLoop=0;
            PTU.isActiveRight=0;
            PTU.isActiveLeft=0;
        end
    end

  end

function disp=calculate_displacement(pump,loop)
    disp=interp1(pump.pressBreakpoints,pump.displacementCarac,loop.press);
end

function flow= calculate_flow(rpm, displacement)
        flow= (rpm * displacement / 231.0 / 60.0);
end


function [pump,loop,aileron]= updateL(dt,pump,PTU,loop,aileron)

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



    %Static leaks, random formula to depend on pressure
        staticLeakVol=0.04*dt*(loop.press-14.7)/3000;
        deltavol=deltavol-staticLeakVol;
        %if !leakFailure
        reservoirReturn=reservoirReturn+staticLeakVol; %Static leaks are back to reservoir unless failure case
    %%%end static leaks

    %Adding ptu flows after pump
    %TODO Handle it as a min/max flow producer if possible?
    if loop.isLeft
        if PTU.flowToLeftLoop > 0
            %were are left side of PTU and positive flow so we receive flow using own reservoir
            actualFlow=min(loop.res/dt,PTU.flowToLeftLoop);
            loop.res=loop.res-actualFlow* dt;
        else
            %we are using own flow to power right side so we send that back
            %to our own reservoir
            actualFlow=PTU.flowToLeftLoop;
            reservoirReturn=reservoirReturn-actualFlow* dt;
        end
        deltavol=deltavol+actualFlow * dt;
        %reservoirReturn=reservoirReturn+actualFlow;
    else
        if PTU.flowToRightLoop > 0
            %were are right side of PTU and positive flow so we receive flow using own reservoir
            actualFlow=min(loop.res/dt,PTU.flowToRightLoop);
            loop.res=loop.res-actualFlow* dt;
        else
            %we are using own flow to power left side so we send that back
            %to our own reservoir
            actualFlow=PTU.flowToRightLoop;
            reservoirReturn=reservoirReturn-actualFlow* dt;
        end
        deltavol=deltavol+actualFlow* dt;
        %reservoirReturn=reservoirReturn+actualFlow;
    end


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

    %%%%%%%%%%%%%%%%%%%%%%%%%%ACCUMULATOR%%%%%%%%%%%%
    accumulatorDeltaPress = loop.accumulator_gas_pressure - loop.press;
    flowVariation = interp1(loop.accumulator_DeltaPressBreakpoints,loop.accumulator_DeltaPressFlowCarac,abs(accumulatorDeltaPress)) ;

    %%TODO HANDLE OR CHECK IF RESERVOIR AVAILABILITY is OK
    %%TODO check if accumulator can be used as a min/max flow producer to
    %%avoid it being a consumer that might unsettle pressure
    if ( accumulatorDeltaPress > 0 )
        volumeFromAcc = min(loop.accumulator_fluid_volume, flowVariation * dt );
        loop.accumulator_fluid_volume=loop.accumulator_fluid_volume-volumeFromAcc;
        loop.accumulator_gas_volume=loop.accumulator_gas_volume+volumeFromAcc;
        deltavol = deltavol + volumeFromAcc;
    else
        volumeToAcc = max(max(0,deltavol), flowVariation * dt );
        %volumeToAcc = flowVariation * dt ;%TODO handle if flow actually available: maybe using deltavolMAX
        loop.accumulator_fluid_volume=loop.accumulator_fluid_volume+volumeToAcc;
        loop.accumulator_gas_volume=loop.accumulator_gas_volume-volumeToAcc;
        deltavol = deltavol - volumeToAcc;
    end

    loop.accumulator_gas_pressure = (loop.ACCUMULATOR_GAS_PRECHARGE * loop.ACCUMULATOR_MAX_VOLUME) / (loop.ACCUMULATOR_MAX_VOLUME - loop.accumulator_fluid_volume);
    %%%%%%%%%%%%%%%%%%%END ACCUMULATOR%%%%%%%%%%%%%%%%



    %%%%UPDATE ALL ACTUATORS OF THIS LOOP
        used_fluidQty=0; %%total fluid used
        pressUsedForForce=0;

    %FOR EACH MOVINGPART
% % %     used_fluidQty =used_fluidQty+aileron.volumeToActuatorAccumulated*264.172; %264.172 is m^3 to gallons
% % %     reservoirReturn=reservoirReturn+aileron.volumeToResAccumulated*264.172;
% % %
% % %     %Reseting vars for next loop:
% % %     aileron.volumeToActuatorAccumulated=0;
% % %     aileron.volumeToResAccumulated=0;
% % %     %%%%%
% % %
% % %     %Setting press usable by the actuator for this iteration
% % %     aileron.loopPressAvailable = loop.press;
% % %
% % %     %%%%%%%%End FOREACH%%%%%%%%%%%%%%%
% % %
% % %     %Simuating the 3 gears by multiplying used quantities
% % %     used_fluidQty=used_fluidQty*2.5;
% % %     reservoirReturn=reservoirReturn*2.5;

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

    %Loop Pressure update From Bulk modulus
    loop.press = loop.press + deltaPress_from_deltaVolume(deltavol,loop);
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

    %Update res
    loop.res=loop.res-actual_volume_added_to_pressurise; %limit to 0 min? for case of negative added?
    loop.res=loop.res+reservoirReturn;

    %Update Volumes
    loop.delta_vol=deltavol;
    loop.volume=loop.volume+deltavol;
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
