import React, { useEffect, useRef } from "react";
import { useTranslation } from "next-i18next";
import { type GetStaticProps, type NextPage } from "next";
import Button from "../components/Button";
import { FaCog, FaRobot, FaStar } from "react-icons/fa";
import AutonomousAgent from "../services/agent/autonomous-agent";
import HelpDialog from "../components/dialog/HelpDialog";
import { useAuth } from "../hooks/useAuth";
import { useAgent } from "../hooks/useAgent";
import { isEmptyOrBlank } from "../utils/whitespace";
import { resetAllMessageSlices, useAgentStore, useMessageStore } from "../stores";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { languages } from "../utils/languages";
import nextI18NextConfig from "../../next-i18next.config.js";
import { SignInDialog } from "../components/dialog/SignInDialog";
import { ToolsDialog } from "../components/dialog/ToolsDialog";
import DashboardLayout from "../layout/dashboard";
import AppTitle from "../components/AppTitle";
import FadeIn from "../components/motions/FadeIn";
import Input from "../components/Input";
import clsx from "clsx";
import Expand from "../components/motions/expand";
import ChatWindow from "../components/console/ChatWindow";
import { TaskWindow } from "../components/TaskWindow";
import { AnimatePresence, motion } from "framer-motion";
import { useSettings } from "../hooks/useSettings";
import { useRouter } from "next/router";
import { useAgentInputStore } from "../stores/agentInputStore";
import { MessageService } from "../services/agent/message-service";
import { DefaultAgentRunModel } from "../services/agent/agent-run-model";
import { resetAllTaskSlices } from "../stores/taskStore";
import { ChatWindowTitle } from "../components/console/ChatWindowTitle";
import { AgentApi } from "../services/agent/agent-api";
import { toApiModelSettings } from "../utils/interfaces";
import ExampleAgents from "../components/console/ExampleAgents";
import Summarize from "../components/console/SummarizeButton";
import AgentControls from "../components/console/AgentControls";

const Home: NextPage = () => {
  const { t } = useTranslation("indexPage");
  const addMessage = useMessageStore.use.addMessage();
  const messages = useMessageStore.use.messages();
  const { query } = useRouter();

  const setAgent = useAgentStore.use.setAgent();
  const agentLifecycle = useAgentStore.use.lifecycle();

  const agent = useAgentStore.use.agent();

  const fullscreen = agent !== null;
  const { session, status } = useAuth();
  const nameInput = useAgentInputStore.use.nameInput();
  const setNameInput = useAgentInputStore.use.setNameInput();
  const goalInput = useAgentInputStore.use.goalInput();
  const setGoalInput = useAgentInputStore.use.setGoalInput();
  const [mobileVisibleWindow, setMobileVisibleWindow] = React.useState<"Chat" | "Tasks">("Chat");
  const { settings } = useSettings();

  const [showSignInDialog, setShowSignInDialog] = React.useState(false);
  const [showToolsDialog, setShowToolsDialog] = React.useState(false);
  const agentUtils = useAgent();

  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameInputRef?.current?.focus();
  }, []);

  const setAgentRun = (newName: string, newGoal: string) => {
    setNameInput(newName);
    setGoalInput(newGoal);
    handlePlay(newName, newGoal);
  };

  const disableStartAgent =
    (agent !== null && !["paused", "stopped"].includes(agentLifecycle)) ||
    isEmptyOrBlank(nameInput) ||
    isEmptyOrBlank(goalInput);

  const handlePlay = (name: string, goal: string) => {
    if (agentLifecycle === "stopped") handleRestart();
    else if (name.trim() === "" || goal.trim() === "") return;
    else handleNewAgent(name.trim(), goal.trim());
  };

  const handleNewAgent = (name: string, goal: string) => {
    if (session === null) {
      setShowSignInDialog(true);
      return;
    }

    if (agent && agentLifecycle == "paused") {
      agent?.run().catch(console.error);
      return;
    }

    const model = new DefaultAgentRunModel(name.trim(), goal.trim());
    const messageService = new MessageService(addMessage);
    const agentApi = new AgentApi({
      model_settings: toApiModelSettings(settings, session),
      name: name,
      goal: goal,
      session,
      agentUtils: agentUtils,
    });
    const newAgent = new AutonomousAgent(
      model,
      messageService,
      settings,
      agentApi,
      session ?? undefined
    );
    setAgent(newAgent);
    newAgent?.run().then(console.log).catch(console.error);
  };

  const handleRestart = () => {
    resetAllMessageSlices();
    resetAllTaskSlices();
    setAgent(null);
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement> | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    // Only Enter is pressed, execute the function
    if (e.key === "Enter" && !disableStartAgent && !e.shiftKey) {
      handlePlay(nameInput, goalInput);
    }
  };

  const handleVisibleWindowClick = (visibleWindow: "Chat" | "Tasks") => {
    // This controls whether the ChatWindow or TaskWindow is visible on mobile
    setMobileVisibleWindow(visibleWindow);
  };

  return (
    <DashboardLayout>
      <HelpDialog />
      <ToolsDialog show={showToolsDialog} close={() => setShowToolsDialog(false)} />

      <SignInDialog show={showSignInDialog} close={() => setShowSignInDialog(false)} />
      <div id="content" className="flex min-h-screen w-full items-center justify-center">
        <div
          id="layout"
          className="flex h-screen w-full max-w-screen-xl flex-col items-center gap-1 p-2 sm:gap-3 sm:p-4"
        >
          {
            <AnimatePresence>
              {!fullscreen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "fit-content" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, type: "easeInOut" }}
                >
                  <AppTitle />
                </motion.div>
              )}
            </AnimatePresence>
          }
          <div>
            <Button
              className={clsx(
                "rounded-r-none py-0 text-sm sm:py-[0.25em] xl:hidden",
                mobileVisibleWindow == "Chat" ||
                  "border-2 border-white/20 bg-gradient-to-t from-sky-500 to-sky-600 hover:bg-gradient-to-t hover:from-sky-400 hover:to-sky-600"
              )}
              disabled={mobileVisibleWindow == "Chat"}
              onClick={() => handleVisibleWindowClick("Chat")}
            >
              Chat
            </Button>
            <Button
              className={clsx(
                "rounded-l-none py-0 text-sm sm:py-[0.25em] xl:hidden",
                mobileVisibleWindow == "Tasks" ||
                  "border-2 border-white/20 bg-gradient-to-t from-sky-500 to-sky-600 hover:bg-gradient-to-t hover:from-sky-400 hover:to-sky-600"
              )}
              disabled={mobileVisibleWindow == "Tasks"}
              onClick={() => handleVisibleWindowClick("Tasks")}
            >
              Tasks
            </Button>
          </div>
          <Expand className="flex w-full flex-grow overflow-hidden">
            <ChatWindow
              messages={messages}
              title={<ChatWindowTitle model={settings.customModelName} />}
              setAgentRun={setAgentRun}
              visibleOnMobile={mobileVisibleWindow === "Chat"}
            >
              {messages.length === 0 && <ExampleAgents setAgentRun={setAgentRun} />}
              <Summarize />
            </ChatWindow>
            <TaskWindow visibleOnMobile={mobileVisibleWindow === "Tasks"} />
          </Expand>

          <FadeIn
            delay={0}
            initialY={30}
            duration={1}
            className="flex w-full flex-col items-center gap-2"
          >
            <AnimatePresence>
              {!fullscreen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "fit-content" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, type: "easeInOut" }}
                  className="flex w-full flex-col gap-2"
                >
                  <div className="flex w-full flex-row items-end gap-2 md:items-center">
                    <Input
                      inputRef={nameInputRef}
                      left={
                        <>
                          <FaRobot />
                          <span className="ml-2">{`${t("AGENT_NAME")}`}</span>
                        </>
                      }
                      value={nameInput}
                      disabled={agent != null}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e)}
                      placeholder="AgentGPT"
                      type="text"
                    />
                    <Button
                      ping
                      onClick={() => setShowToolsDialog(true)}
                      className="border-white/20 bg-gradient-to-t from-sky-500 to-sky-600 transition-all hover:bg-gradient-to-t hover:from-sky-400 hover:to-sky-600"
                    >
                      <p className="mr-3">Tools</p>
                      <FaCog />
                    </Button>
                  </div>
                  <Input
                    left={
                      <>
                        <FaStar />
                        <span className="ml-2">{`${t("LABEL_AGENT_GOAL")}`}</span>
                      </>
                    }
                    disabled={agent != null}
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e)}
                    placeholder={`${t("PLACEHOLDER_AGENT_GOAL")}`}
                    type="textarea"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <AgentControls
              disablePlay={disableStartAgent}
              lifecycle={agentLifecycle}
              handlePlay={() => handlePlay(nameInput, goalInput)}
              handlePause={() => agent?.pauseAgent()}
              handleStop={() => agent?.stopAgent()}
            />
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async ({ locale = "en" }) => {
  const supportedLocales = languages.map((language) => language.code);
  const chosenLocale = supportedLocales.includes(locale) ? locale : "en";

  return {
    props: {
      ...(await serverSideTranslations(chosenLocale, nextI18NextConfig.ns)),
    },
  };
};
