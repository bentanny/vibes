"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Sparkles } from "lucide-react";

interface AutomateStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AutomateStrategyModal({
  isOpen,
  onClose,
}: AutomateStrategyModalProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonColor = mounted && theme === "dark" ? "#2a2a2a" : "#E0DACF";
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Automate Trading Strategy
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-sm text-default-600">
                  This will create an automated trading bot that executes your
                  momentum strategy automatically.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">What happens next:</h4>
                  <ul className="space-y-1 text-sm text-default-600">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        Your strategy will be configured as an automated bot
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        The bot will monitor market conditions 24/7
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>
                        Trades will be executed automatically based on your rules
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                onPress={onClose}
                style={{ backgroundColor: buttonColor }}
                startContent={<Sparkles className="h-4 w-4" />}
              >
                Create Automated Bot
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

